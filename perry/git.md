# Git workflow

> **Read when:** doing any git work — staging, committing, history edits, aliases, or writing commit messages.

- **Stage discipline.** Stage related changes together for one logical commit; use fixup commits for edits that belong on a prior commit; leave the working tree clean after each commit. Don't bundle unrelated fixes into the same commit.
- **Keep it simple.** Default to `reset` + `cherry-pick` or `commit --amend` over `rebase` unless multi-commit history rewriting is required.
- Use `git fixup <sha>` (`git commit --fixup=<sha>`) for changes intended for an earlier commit; `git squash <sha>` for non-fast-forward folds.
- Honor these aliases:
  - `git lg` / `git ll` — compact / detailed log graphs
  - `git lsu` — `log -100000 @{u}^..` (everything ahead of upstream)
  - `git df` / `git dfc` — `diff -M -w` / `--cached`
  - `git st` — `status -sb` (short + branch info)
  - `git amend` — `commit --amend --no-edit`
- **Multiline commit messages** (especially with backticks or shell metacharacters): write the message to a temp file with a quoted heredoc and use `git commit -F`; don't interpolate it through a shell variable.
