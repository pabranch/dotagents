# ~/.PERRY.md

**Audience: AI agents.** Format this file for parsing, not for humans —
backticks for literal commands, files, and paths; terse, unambiguous phrasing.

Personal persistent context for coding agents working with Perry. Loaded via reference, for example from `~/.pi/agent/AGENTS.md`. Project and Agent agnostic — applies to every session unless overridden by a project-local `CLAUDE.md` or `AGENTS.md` file.

## Working style

- **Never push unless explicitly told to do so.** Don't run `git push`
  or `git fp` until Perry asks. When a push is explicitly requested,
  default to plain `git push`; reach for `git fp` (force-with-lease)
  only when force-push is needed.
- **Ask when uncertain.** Perry does not mind answering questions. If instructions are confusing, stop and ask rather than overthinking or guessing. Clarification is cheaper than a wrong move.
- **Improve or ask — don't be overly literal.** When a request has an
  obvious imperfection (redundancy, a clearly better alternative, etc.),
  surface the better version or ask before completing. There is no
  penalty for clarifying questions, but there is for shipping a worse
  result when a better one was obvious.
- **Append freely to this file.** You are permitted to update `~/.PERRY.md`
  whenever you notice something that would streamline future work together.
  Add new content; do not silently rewrite existing instructions.
- **Lean context.** Concise summaries and tables are appreciated over
  running prose. Context tokens = cost, so prefer tight context files and
  link out for detail rather than duplicating.
- **Keep it simple** Default to `reset` + `cherry-pick` or `commit --amend`
  over `rebase` unless multi-commit history rewriting is required

## AI Agent Tooling Preferences

- **Prefer Modern Tooling:** When performing system tasks, leverage modern tools installed in the environment for better performance and context:
  - **`ripgrep` (rg):** Use for all searching and pattern matching.
  - **`fd`** Use for file discovery (respects ignore patterns).
  - **`eza`** Use for directory listings (prefers color and metadata).
  - **`bat`** Use for file viewing (syntax highlighting and line numbers).
  - **`zoxide`/`fzf`** Use for efficient file/directory navigation.
  - **assume GNU syntax** Mention BSD/macOS differences only when they're material edge cases

## Git workflow

- **Stage discipline** stage related changes together for one logical
  commit; use fixup commits for edits that belong on a prior commit;
  leave the working tree clean after each commit. Don't bundle
  unrelated fixes into the same commit.
- Use `git fixup <sha>` (`git commit --fixup=<sha>`) to mark a change
  intended for an earlier commit. Use `git squash <sha>` for
  non-fast-forward folds.
- Some commonly-used aliases worth honoring:
  - `git lg` / `git ll`: compact / detailed log graphs
  - `git lsu`: `log -100000 @{u}^..` (everything ahead of upstream)
  - `git df` / `git dfc`: `diff -M -w` / `--cached`
  - `git st`: `status -sb` (short + branch info)
  - `git amend`: `commit --amend --no-edit`
- For multiline commit messages, especially text containing backticks or shell
  metacharacters, write the message to a temporary file with a quoted heredoc
  and use `git commit -F`; do not interpolate it through a shell variable.

## Testing and verification

- Reproduce and test against the current working copy whenever possible. If
  Perry is copying files, altering live configuration, removing installed
  software, running tests, or copying diagnostic output for an automatable
  check, offer to perform and isolate that work instead.
- Isolate tests that would affect `$HOME`, editor plugins, tmux sessions, package
  state, or other user data. Use temporary directories/configuration, capture
  the real program's diagnostics, and clean up afterward.
- After edits, run and surface quick, relevant sanity checks such as
  `git diff --check`, `bash -n`, and focused tool-specific validation. Report
  whether changes are staged, unstaged, committed, or pushed.

## Dotfiles configuration

- Perry's dotfiles live in a bare git repo at `~/.cfg` (worktree `~/`,
  exposed via the `cfg` alias). For dotfile work, also follow
  `~/.config/dotbare-cfg/AGENTS.md`.
