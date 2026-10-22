# Global Agent instructions

The `~/.agents` directory contains agent-configuration settings. Cross-agent by design. Every agent gets this file in context, so keep it terse. Loaded via reference, for example from `~/.config/pi/AGENTS.md`. Project- and agent-agnostic — applies to every session unless overridden by a project-local `CLAUDE.md` or `AGENTS.md` file.

## Primary directives

- Be concise. Be upfront.
- Provide constructive feedback as appropriate.

## Git

- **Never push unless explicitly told.** Plain `git push` by default; `git fp` (force-with-lease) only when a force-push is needed.

## Important Files

- `AGENTS.md` — this file; agent directives & pointers
- `README.md` — directions specific to working in the `~/.agents` Git repo
- `PERRY.md` — user preferences
- `~/.agents/perry/*.md` — topic files (`tooling.md`, `git.md`, `testing.md`, `dotfiles.md`, `principles.md`). Read only the one matching the task; each states its own `Read when` trigger.

## Handoff files

- A `HANDOFF.md` may exist in any directory you work in, not just `~/.agents`. If one exists in your current directory, **read it before starting**; it carries background for work in progress: why staged/uncommitted changes exist, recent context, and what remains.
- Scoped variants use a dotted topic suffix: `HANDOFF.<topic>.md` (e.g. `HANDOFF.agent-communication.md`). If a variant exists in your current directory and its topic relates to your task, read it before starting.
- Handoff files are transient current state, not durable instruction files.
- **Never commit a handoff file**, and **do not gitignore it.** Leaving it untracked keeps it visible in `git status` noise, which motivates completing (or explicitly deleting) the handoff. A lingering untracked `HANDOFF*.md` is a task waiting to be closed. This relies on reading status output — `git add -A` will still commit the file.

## Skills

- Skills for **all** agents: `~/.agents/skills/` (each has its own `SKILL.md`).
- Agent-specific skills/config/instructions: `~/.agents/<agent-name>/` — e.g. `~/.agents/pi/`, `~/.agents/pi/AGENTS.md` and `~/.agents/pi/extensions`.
- Some skills are duplicated as identical copies under each agent's config dir (`~/.config/pi/skills/`, `~/.config/opencode/skills/`, `~/.claude/skills/`) — currently workmux, coordinator, merge, open-pr, rebase, worktree. They have no single source yet: when updating one, sync all copies (check `diff` first; drift already happened with workmux).
