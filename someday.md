# Someday

## Auto-update OpenRouter prices (once per day)

The `openrouter-auto-cost` extension (`~/.pi/agent/extensions/openrouter-auto-cost.ts`) currently
prices routed models from a hand-calibrated `RATES` map. The models.dev catalog is unreliable for
some OpenRouter models (e.g. `deepseek/deepseek-v4-flash-0731` was ~7.7x off), and the router picks
new models without warning, so the map goes stale.

Expand the extension to fetch current pricing from the OpenRouter models API (e.g.
`GET https://openrouter.ai/api/v1/models`) and refresh at most once per day:

- On `session_start`, check a cache file (e.g. `~/.pi/agent/openrouter-prices.json`) for an
  `updatedAt` within the last 24h; if stale, fetch and rewrite it.
- Look up `responseModel` prices (USD per million) from that cache in the `message_end` handler,
  falling back to the bundled `RATES` map, then to $0 + warning for still-unknown models.
- Keep the fetch non-blocking and fail soft: on network/parse error, keep the cached or bundled
  rates and do not block the session.
- Surface the cache age somewhere (status/footer or a one-time notice) so stale data is visible.
- The repair skill (`~/.pi/agent/skills/openrouter-cost-fix/`) should read the same cache so
  historical repricing and live pricing agree.
