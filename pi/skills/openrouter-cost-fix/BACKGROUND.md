# Background

Root cause, symptoms, and operational tips for OpenRouter `auto` cost tracking.

## Why auto costs are wrong

Pi prices every response against the **selected** model. `openrouter/auto` routes to a concrete model and reports it in `message.responseModel`, but Pi ignores that for pricing. Two catalog states produce two failure eras:

- **Negative costs** — the catalog price for `openrouter/auto` was the sentinel `-1000000` per million tokens, so Pi computed `cost = -1 * tokens`.
- **Zero costs** — the catalog price is now `0`, so every auto response records `$0`.

Either way the routed model's real rate is never applied.

## How the fix is wired

Three parts share one pricing source of truth, `models.json` (agent dir, e.g. `~/.config/pi/models.json`) under `providers.openrouter.modelOverrides`:

- **Extension** `~/.agents/pi/extensions/openrouter-auto-cost.ts` — on `message_end`, when the reported cost is non-positive and tokens are billable, it recomputes `usage.cost` from the routed model's rate in the model registry (which merges `modelOverrides`). Unknown routed models are recorded as `$0` with a notification.
- **Fixer** `scripts/fix-openrouter-costs.py` — reprices already-persisted non-positive entries from the same `models.json`; unknown negatives are zeroed and reported.
- **`models.json`** — the overrides the registry and the fixer both read.

The extension only fixes **future** entries in the **running** process; persisted history needs the fixer.

## Tips and gotchas

- **The extension must actually load.** It lives outside the auto-scanned extensions dir, so it needs a `settings.json` entry such as `"extensions": ["~/.agents/pi/extensions"]`. If `pi config` looks unchanged, don't trust that alone: verify functionally with a throwaway auto call and check that a routed response gets a positive cost, for example `pi --mode json --no-session --model openrouter/auto "Reply: ok"`.
- **Restart Pi after changing rates or loading the extension.** A running process keeps its previously loaded configuration and keeps writing wrong costs; rerun the fixer after restart to catch entries written since the repair.
- **`models.json` may not exist.** Create it; the fixer errors out rather than degrade when it is missing or invalid.
- **Fixer is dry-run by default.** Preview, review every file/count and unknown model, then `--apply`. `PI_SESSION_ROOT` overrides the session root; each changed file gets a sibling `.jsonl.bak-<epoch>` backup.
- **Backups keep the source mtime** (`shutil.copy2`), so time-based `find` may not list them; look for `.bak-*` directly.
- **Tiers are not honored.** Both the extension and the fixer use base `input`/`output`/`cacheRead`/`cacheWrite` rates only, so requests above a tier threshold (for example 272k tokens on the `luna` models) are undercharged. Copying `tiers` into `models.json` keeps the registry correct but does not change the extension or fixer math.
- **Use the OpenRouter catalog rates** from `~/.config/pi/models-store.json` (`openrouter.models[].cost`) as a starting point, but confirm against the dashboard; a routed model with no rate gets zeroed, not guessed.
- **Never give `openrouter/auto` a positive `cost`.** The extension only acts when Pi's computed cost is ≤ 0, so a positive auto rate makes Pi price every auto response at that value and silently disables per-routed-model correction. Put rates on the routed models only; an `openrouter/auto` override should carry metadata (for example `reasoning`, `thinkingLevelMap`) but no `cost`.
- **The live session file is safe to rewrite.** Pi appends per write and does not hold the session file open, so the fixer's atomic replace is fine; only the in-memory cost display stays stale until restart.
