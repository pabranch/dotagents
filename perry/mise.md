# mise preferences

> **Read when:** selecting project runtimes or tools, or managing project environments or secrets with mise or fnox.

- Use mise for project tools and environment handling; use Homebrew for system-level applications.
- For one-off tools outside a configured project, prefer a temporary mise invocation over a global install.
- When changing project code, pin the required tool versions in a local `mise.toml` so ordinary tool commands use the project versions.
- **Secrets: always `fnox exec`, never mise `[env]`.** Inject per command with `fnox exec -- <cmd>` (directly or in mise `[tasks]`). Don't use the `fnox-env` mise plugin or `env = true` on secrets; the global fnox `env = "exec"` default is intentional.
