# Work dotfiles

> **Read when:** working on dotfiles on Perry's work computer (`~/.config/dotfiles/git/`).

- Bare repo: `~/.config/dotfiles/git/`; worktree: `~/`. In Bash, `cfg` points to this repo and worktree.
- Supporting configuration belongs under `~/.config/dotfiles/`. The personal `~/.cfg` and `~/.config/dotbare-cfg/` paths do not apply here.
- The remote is hosted on work GitLab, not the personal GitHub repo.
- Untracked files are hidden by default; `cfg sta` includes all of them. Stage explicit paths: home contains unrelated and sensitive files.
- Repo-local settings, including `cfg sta`, `core.ignorecase=false`, and `git/info/exclude`, live inside the bare repo and are not tracked dotfiles. They do not follow a clone.
- The work-specific `~/.agents/skills/galvanize-curriculum/` skill is tracked by the work dotfiles repo and ignored by the agents repo. The repos share this nested path; explicitly stage skill files with `cfg`.
