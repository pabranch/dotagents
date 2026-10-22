# Workmux

> **Read when:** working with workmux, its bundled skills, or their symlinks in agent skill directories.

- Locally modified workmux-bundled skills are version-controlled in `~/.agents/workmux/skills/<name>/` — currently only `workmux`. Each agent's skills dir (`~/.config/pi/skills/`, `~/.config/claude/skills/`) holds a symlink to the canonical copy; do not edit those as separate files. workmux reinstalls bundled skills into agent dirs on update; if a symlink is replaced by a real file again, re-link it to `~/.agents/workmux/skills/<name>`.
- Unmodified workmux-bundled skills (coordinator, merge, open-pr, rebase, worktree) are disposable per-agent copies; version-control them only after you actually change one (move it under `~/.agents/workmux/skills/` and symlink it).
