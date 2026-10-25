# Tooling preferences

> **Read when:** performing system tasks, searching the filesystem, choosing CLI tools, or answering questions about shell/command history.

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

## Shell history

History is recorded in **Atuin** (and queryable through its MCP server). When returning the user's history, include only commands the user ran; exclude agent-run entries (they carry an author such as `pi` or `claude-code`) unless the user explicitly asks for agent activity. In Atuin, filter with `authors: ["$all-user"]` (MCP) or `--author '$all-user'` (CLI).

## Running tools with mise

`mise` is already on `PATH`.

- For a tool not configured in the current directory, run it one-off with
  `mise exec <tool>@<version> -- <tool> ...`, e.g.
  `mise exec go@1.26.4 -- go build`. mise caches the resolved tool, so repeat
  runs are fast after the first.
- When changing a project's code, add a local `mise.toml` (e.g. `go = "1.26"`)
  so the version is pinned and the bare tool name works inside the directory.
- **Workmux worktree paths.** Worktrees live in `<parent>/<project>__worktrees/<name>`, a sibling of `<parent>/<project>`, so a prompt file in a worktree refers to project-level files as `../../<project>.TODO.md`, not `../<project>.TODO.md`.
