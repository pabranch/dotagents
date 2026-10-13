# Pi agent context

Agent-specific context for the `pi` coding agent.

- **"All sessions"**: when Perry asks about *all sessions*, find them by listing every `*.jsonl` file under `$PI_CODING_AGENT_DIR/sessions/` (defaults to `~/.config/pi/sessions/`) (recursively; each session is a JSONL transcript).
- The file for the current session is in `$PI_SESSION_FILE`.
