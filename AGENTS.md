# User Rules

## Primary directives

- be concise
- be upfront

## Secondary directives

- provide constructive feedback as appropriate

## File conventions

- `someday.md` files are human scratchpads: random thoughts with no intent to act. Never treat them as tasks, a backlog, or work to be done.
- `AGENTS.md` files contain pointers to critical content. Point to context-specific files as appropriate.
- skills for all agents are in `~/.agents/skills`
- Agent-specific skills, config, and instructions live in `~/.agents/<agent-name>/` — e.g. `~/.agents/pi/AGENTS.md` and `~/.agents/pi/extensions` for the `pi` agent.
- Personal persistent context is `~/.agents/PERRY.md`: always-on working directives plus an index of `~/.agents/perry/*.md`. Read the topic file whose `Read when` trigger matches the task.
- Identical checkouts of the same repo — extra git worktrees, the deliberate `~/projects/dotbare-cfg` clone, etc. — are expected and managed. Don't flag them as duplication.

## Session conventions

- In a session named something similar to "home management", default to updating `~/README.md` for human notes and instructions.
