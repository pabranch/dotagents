# Atuin preferences

> **Read when:** investigating shell history, captured terminal output, or recovering earlier work.

- When reporting Perry's command history, include human-run commands by default. Include agent-run commands only when requested.
- Keep searches bounded: start with distinctive terms and small result limits. For a known command, locate its history entry first; when only printed text is known, search output with minimal context.
- Read captured output in narrow line ranges, expanding around relevant matches. Refine noisy queries before increasing limits.
- For recovery, compare command timestamps with the destructive operation. A later diff cannot reconstruct an earlier state; report missing capture rather than infer lost changes.
