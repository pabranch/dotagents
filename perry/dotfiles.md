# Dotfiles configuration

> **Read when:** working on dotfiles or the `cfg` bare repo, or writing commits for them.

On the work computer, follow `~/.agents/perry/work-dotfiles.md` instead of the personal setup below. The commit prefixes below are for the personal repo.

## Personal setup

- Perry's personal dotfiles live in a bare git repo at `~/.cfg` (worktree `~/`, exposed via the `cfg` alias).
- `~/projects/dotbare-cfg` is a separate clone of `~/.cfg`, kept on purpose: the `~/` worktree sets `status.showUntrackedFiles=no`, so the clone is where untracked files show in status. Treat it as intentional, not a duplicate.
- Work is often pushed to GitHub from the `~/projects/dotbare-cfg` clone. Afterwards the `~/.cfg` bare repo still needs a `git fetch` before its `origin/main` reflects the push — otherwise it reports `ahead` spuriously.
- For dotfile work, also follow `~/.config/dotbare-cfg/AGENTS.md`.

## User bin directories

- `~/.local/bin` is canonical; `~/bin` aliases it via a Linux symlink or Windows junction. The alias is host-specific and not tracked in Git; shell configuration puts both paths on `PATH`.
- Track intentional scripts under `.local/bin/`, not `bin/`. `.local` is ignored, so force-add new scripts explicitly (for example, `cfg add -f -- ~/.local/bin/<file>`); keep tool-managed binaries untracked.
- Git may also report those files as untracked via `bin/`. Stage the canonical `.local/bin/` paths explicitly, not the alias paths.
- Checking out or rebasing historical commits that track `bin/` can remove or replace the alias. Verify it afterward; compare and preserve both directories' contents before repairing it.

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
