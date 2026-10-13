#!/usr/bin/env python3
"""Repair OpenRouter `openrouter/auto` sentinel costs already persisted in session JSONL files.

pi prices every response against the selected model. For `openrouter/auto` the catalog
price is the sentinel `-1000000` per million input/output tokens, so historical
sessions recorded `cost = -1 * tokens`. This walks each session file and
recomputes non-positive costs from the response model's rates. Routed models
with unknown negative costs are set to $0 and reported. Pricing is read from the
OpenRouter model overrides in the active agent directory's models.json, which
is also the extension's source of truth.

Usage:
    python3 fix-openrouter-costs.py            # dry run, report only
    python3 fix-openrouter-costs.py --apply    # rewrite files (writes a .bak)
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import shutil
import sys
import time

_default_agent_dir = os.path.join(os.environ.get("XDG_CONFIG_HOME", "~/.config"), "pi")
AGENT_DIR = os.path.expanduser(os.environ.get("PI_CODING_AGENT_DIR", _default_agent_dir))
MODELS_JSON = os.path.join(AGENT_DIR, "models.json")
SESSION_ROOT = os.environ.get("PI_SESSION_ROOT", os.path.join(AGENT_DIR, "sessions"))

def load_rates() -> dict[str, dict[str, float]]:
    """Read per-million OpenRouter costs from the agent's models.json overrides."""
    try:
        with open(MODELS_JSON, encoding="utf-8") as handle:
            config = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"cannot read valid models.json at {MODELS_JSON}: {exc}") from exc

    overrides = config.get("providers", {}).get("openrouter", {}).get("modelOverrides", {})
    rates = {}
    for model_id, override in overrides.items():
        cost = override.get("cost") if isinstance(override, dict) else None
        if not isinstance(cost, dict):
            continue
        if all(isinstance(cost.get(key), (int, float)) for key in ("input", "output", "cacheRead", "cacheWrite")):
            rates[model_id] = {key: float(cost[key]) for key in ("input", "output", "cacheRead", "cacheWrite")}
    return rates


def response_model_for(entry: dict):
    """Best-effort response model for a top-level session entry."""
    message = entry.get("message")
    if isinstance(message, dict):
        if message.get("responseModel"):
            return message["responseModel"]
        # OpenRouter only sets responseModel when it differs from the selected model.
        if message.get("model") and message["model"] != "auto":
            return message["model"]
    for key in ("responseModel", "model"):
        if entry.get(key):
            return entry[key]
    return None


def recompute(usage: dict, rates: dict) -> None:
    cost = usage["cost"]
    inp = usage.get("input", 0) or 0
    out = usage.get("output", 0) or 0
    cr = usage.get("cacheRead", 0) or 0
    cw = usage.get("cacheWrite", 0) or 0
    new = {
        "input": rates["input"] * inp / 1e6,
        "output": rates["output"] * out / 1e6,
        "cacheRead": rates["cacheRead"] * cr / 1e6,
        "cacheWrite": rates["cacheWrite"] * cw / 1e6,
    }
    new["total"] = new["input"] + new["output"] + new["cacheRead"] + new["cacheWrite"]
    cost.update(new)


def zero(usage: dict) -> None:
    usage["cost"] = {"input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0, "total": 0}


def walk_usages(node, out):
    if isinstance(node, dict):
        cost = node.get("cost")
        if (
            isinstance(cost, dict)
            and isinstance(cost.get("total"), (int, float))
            and "input" in node
        ):
            out.append(node)
        for value in node.values():
            walk_usages(value, out)
    elif isinstance(node, list):
        for value in node:
            walk_usages(value, out)


def process_file(path: str, apply: bool, rates_by_model: dict[str, dict[str, float]]):
    lines = open(path, encoding="utf-8").read().splitlines()
    fixed_known = 0
    fixed_unknown = 0
    unknown_models: set[str] = set()
    changed = False

    for i, line in enumerate(lines):
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        message = entry.get("message")
        if not isinstance(message, dict) or message.get("provider") != "openrouter":
            continue
        usages: list = []
        walk_usages(entry, usages)
        if not usages:
            continue
        response_model = response_model_for(entry)
        entry_changed = False
        for usage in usages:
            total = usage["cost"]["total"]
            has_tokens = any(usage.get(key, 0) for key in ("input", "output", "cacheRead", "cacheWrite"))
            if total > 0 or not has_tokens:
                continue
            rates = rates_by_model.get(response_model) if response_model else None
            if rates:
                recompute(usage, rates)
                fixed_known += 1
            elif total < 0:
                zero(usage)
                fixed_unknown += 1
                unknown_models.add(response_model or "(unknown model)")
            else:
                continue
            entry_changed = True
        if entry_changed:
            lines[i] = json.dumps(entry, separators=(",", ":"))
            changed = True

    if changed and apply:
        backup = f"{path}.bak-{int(time.time())}"
        shutil.copy2(path, backup)
        tmp = f"{path}.tmp-{os.getpid()}"
        with open(tmp, "w", encoding="utf-8") as handle:
            handle.write("\n".join(lines) + "\n")
        os.replace(tmp, path)

    return fixed_known, fixed_unknown, unknown_models


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="rewrite files (default is dry run)")
    args = parser.parse_args()

    try:
        rates_by_model = load_rates()
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 2

    files = sorted(glob.glob(os.path.join(SESSION_ROOT, "**", "*.jsonl"), recursive=True))
    total_known = total_unknown = 0
    all_unknown: set[str] = set()
    touched = 0

    for path in files:
        known, unknown, unknown_models = process_file(path, args.apply, rates_by_model)
        if known or unknown:
            touched += 1
            total_known += known
            total_unknown += unknown
            all_unknown |= unknown_models
            rel = os.path.relpath(path, SESSION_ROOT)
            print(f"{'fixed' if args.apply else 'would fix'} {known + unknown:4d} in {rel}"
                  f"  (known={known}, unknown={unknown})")

    print()
    print(f"{'Applied' if args.apply else 'Dry run'}: {touched} files, {total_known} entries repriced, "
          f"{total_unknown} entries zeroed")
    if all_unknown:
        print("Routed models with no rate (zeroed):")
        for model in sorted(all_unknown):
            print(f"  - {model}")
        print("Add their rates under providers.openrouter.modelOverrides in models.json if you want them priced.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
