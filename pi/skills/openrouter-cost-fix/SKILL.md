---
name: openrouter-cost-fix
description: Update OpenRouter auto-router model prices or repair persisted session costs. Use when the user asks to change OpenRouter/auto costs, add pricing for a routed model, or fix historical OpenRouter cost totals.
---

# OpenRouter cost maintenance

Keep one pricing source of truth: the active agent directory's `models.json`. The extension reads model prices from Pi's model registry, and the historical fixer reads the same `models.json`; do not maintain a separate rates table.

See [BACKGROUND.md](BACKGROUND.md) for the root cause, symptoms, and operational tips (loading the extension, restarting Pi, tiers, backups).

## Update rates and repair history

1. **Get authoritative prices.** Use user-provided or dashboard-calibrated rates for the concrete routed model ID (for example, `openai/gpt-6-luna`), in USD per million tokens. Do not infer missing input, output, cache-read, or cache-write rates; ask the user for any missing values. Ask about tiers when pricing changes at context thresholds.

2. **Update `models.json`.** Resolve the agent directory from `PI_CODING_AGENT_DIR`, defaulting to `${XDG_CONFIG_HOME:-$HOME/.config}/pi`. In `models.json`, add or update:

   ```json
   {
     "providers": {
       "openrouter": {
         "modelOverrides": {
           "<routed-model-id>": {
             "cost": {
               "input": 0,
               "output": 0,
               "cacheRead": 0,
               "cacheWrite": 0,
               "tiers": []
             }
           }
         }
       }
     }
   }
   ```

   Replace the sample values with the confirmed rates. Preserve unrelated configuration and existing model metadata. The extension and repair script both consume these overrides, so do not add rates to a second map.

3. **Preview historical repairs.** Run the bundled fixer from this skill directory:

   ```bash
   python3 scripts/fix-openrouter-costs.py
   ```

   It is a dry run and reads pricing from the same `models.json`. Review every file/count and any unknown routed model. If a model lacks a confirmed price, ask the user before assigning a rate; update `models.json` and rerun the preview. The fixer reprices every non-positive entry with billable tokens and a configured model price. Unknown negative entries are zeroed and reported; unknown zero-cost entries remain unchanged.

4. **Apply the reviewed repair.** Run:

   ```bash
   python3 scripts/fix-openrouter-costs.py --apply
   ```

   Confirm the output and that each changed session has a sibling `.jsonl.bak-<timestamp>` backup. The session root defaults to `<agent-dir>/sessions`; `PI_SESSION_ROOT` overrides it.

5. **Reload Pi.** Tell the user to restart Pi so the active model registry and extension use the updated prices. The current process can continue writing costs with its previously loaded configuration.
