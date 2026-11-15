# Tooling preferences

> **Read when:** performing system tasks, searching the filesystem, or choosing CLI tools.

Prefer modern tools installed in the environment:

- **`ripgrep` (`rg`)** — all searching and pattern matching.
- **`fd`** — file discovery (respects ignore patterns).
- **`eza`** — directory listings (color and metadata).
- **`bat`** — file viewing (syntax highlighting and line numbers).
- **`zoxide` / `fzf`** — efficient navigation.
- **Assume GNU syntax.** Mention BSD/macOS differences only for material edge cases.

## Tool management

Install and update CLI tools through the system package manager rather than letting applications download their own private copies.

- **Windows:** prefer `scoop` (e.g., `scoop install fd ripgrep`); use `winget` for officially supported distributions where appropriate (e.g., Atuin).
- **Linux (including WSL) and macOS:** use `brew` (e.g., `brew install fd ripgrep`).

Before removing an application's private copies of these tools (e.g., in `~/.config/pi/bin/`), verify compatible package-managed replacements are on `PATH` and the application can use them. Remove only replaceable copies so the managed versions take precedence.

## Tool-specific preferences

- Project runtimes, tools, and environments → [mise.md](mise.md).
- Shell history, captured output, and recovery → [atuin.md](atuin.md).
- Supporting-pane layout → [tuios.md](tuios.md).
- Workmux worktrees and bundled skills → [workmux.md](workmux.md).
- PowerShell background, `$PROFILE`, and *nix muscle memory → [powershell.md](powershell.md).
