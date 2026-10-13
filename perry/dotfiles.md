# Dotfiles configuration

> **Read when:** working on dotfiles or the `cfg` bare repo, or writing commits for them.

- Perry's dotfiles live in a bare git repo at `~/.cfg` (worktree `~/`, exposed via the `cfg` alias).
- For dotfile work, also follow `~/.config/dotbare-cfg/AGENTS.md`.

## Commit prefixes

Commit-prefix reference for the DOTFILES repo (used by humans and agents alike):

| Prefix | Environment | Description |
| --- | --- | --- |
| `GB$` | Git Bash | Changes are Git Bash specific |
| `PS>` | PowerShell | Changes are PowerShell specific |
| `WSL` | Windows Subsystem Linux | Changes are WSL specific |
| `NFC` | Global Compatibility | No Functional Change (refactoring or docs with no behavior change) |
| `WIP` | (Temporary) | Work in Progress (must be squashed/removed before merging to main) |
| `TMP` | (Temporary) | Temporary changes (must be squashed/removed before merging to main) |
| *(none)* | Global Compatibility | Changes are cross-shell compatible |
