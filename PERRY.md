# Working with Perry

**Audience: AI agents.** Format this file for parsing, not for humans —
backticks for literal commands, files, and paths; terse, unambiguous phrasing.

Personal persistent context for coding agents working with Perry. Loaded via reference, for example from `~/.pi/agent/AGENTS.md`. Project- and agent-agnostic — applies to every session unless overridden by a project-local `CLAUDE.md` or `AGENTS.md` file.

## Always applies

- **Never push unless explicitly told to do so.** Don't run `git push` or `git fp` until Perry asks. When a push is explicitly requested, default to plain `git push`; reach for `git fp` (force-with-lease) only when a force-push is needed.
- **Ask when uncertain.** Perry does not mind answering questions. If instructions are confusing, stop and ask rather than overthinking or guessing. Clarification is cheaper than a wrong move.
- **Improve or ask — don't be overly literal.** When a request has an obvious imperfection (redundancy, a clearly better alternative, etc.), surface the better version or ask before completing. There is no penalty for clarifying questions, but there is for shipping a worse result when a better one was obvious.
- **Lean context.** Concise summaries and tables beat running prose. Context tokens cost money, so prefer tight context files and link out for detail rather than duplicating.

## Topic files (read on demand)

Read only the file relevant to the task; each also states its own trigger.

| File | Read when |
| --- | --- |
| `~/.agents/perry/tooling.md` | performing system tasks, searching the filesystem, or choosing CLI tools |
| `~/.agents/perry/principles.md` | making design decisions or resolving conflicting instructions |
| `~/.agents/perry/git.md` | doing any git work — staging, committing, history edits, aliases, commit messages |
| `~/.agents/perry/testing.md` | editing code or config, running tests/diagnostics, or touching `$HOME`, editor plugins, tmux, or packages |
| `~/.agents/perry/dotfiles.md` | working on dotfiles or the `cfg` bare repo |

When you notice something that would streamline future work together, append it to the relevant `~/.agents/perry/*.md` file (or add a new one and a row above). Add new content; do not silently rewrite existing instructions.
