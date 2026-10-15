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

## Skills

- Skills for **all** agents: `~/.agents/skills/` (each has its own `SKILL.md`).
- Agent-specific skills/config/instructions: `~/.agents/<agent-name>/` — e.g. `~/.agents/pi/`, `~/.agents/pi/AGENTS.md` and `~/.agents/pi/extensions`.
