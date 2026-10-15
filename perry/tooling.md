# Tooling preferences

> **Read when:** performing system tasks, searching the filesystem, or choosing CLI tools.

Prefer modern tools installed in the environment:

- **`ripgrep` (`rg`)** — all searching and pattern matching.
- **`fd`** — file discovery (respects ignore patterns).
- **`eza`** — directory listings (color and metadata).
- **`bat`** — file viewing (syntax highlighting and line numbers).
- **`zoxide` / `fzf`** — efficient navigation.
- **Assume GNU syntax.** Mention BSD/macOS differences only for material edge cases.

## Package management

- **brew** — general system-level application management.
- **mise** — project-specific tools needing version management and `.env` handling.

For project work, use `mise`; system-level applications are managed with `brew`.

## Running tools with mise

`mise` is already on `PATH`.

- For a tool not configured in the current directory, run it one-off with
  `mise exec <tool>@<version> -- <tool> ...`, e.g.
  `mise exec go@1.26.4 -- go build`. mise caches the resolved tool, so repeat
  runs are fast after the first.
- When changing a project's code, add a local `mise.toml` (e.g. `go = "1.26"`)
  so the version is pinned and the bare tool name works inside the directory.
