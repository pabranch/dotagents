---
name: archive-session
description: Archive a pi session by exporting it to HTML and compressing it into a .tgz. Use when the user asks to archive, export, bundle, or compress a session or its transcript.
---

# Archive session

Run the bundled script from this skill's directory:

```sh
./scripts/archive-session.sh [session] [output-dir]
```

- `session` — session file path, session ID, or session name. Omit it to archive the current session via `$PI_SESSION_FILE`.
- `output-dir` — directory for the `.tgz`; defaults to the current directory.

The script resolves the session, exports HTML with `pi --export`, writes `<name>-<start-date>.tgz`, and prints the archive path. The source session is left untouched. When a name matches several sessions, the script lists them and exits instead of guessing.

Done when the script prints the `.tgz` path.

Exports contain the full transcript — tool arguments, command output, and file contents. Review an archive before sharing it.
