# mise preferences

> **Read when:** selecting project runtimes or tools, or managing project environments with mise.

- Use mise for project tools and environment handling; use Homebrew for system-level applications.
- For one-off tools outside a configured project, prefer a temporary mise invocation over a global install.
- When changing project code, pin the required tool versions in a local `mise.toml` so ordinary tool commands use the project versions.
