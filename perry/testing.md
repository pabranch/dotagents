# Testing and verification

> **Read when:** editing code or config, running tests or diagnostics, or when work touches `$HOME`, editor plugins, tmux, or installed packages.

- Reproduce and test against the current working copy whenever possible. If Perry is copying files, altering live configuration, removing installed software, running tests, or copying diagnostic output for an automatable check, offer to perform and isolate that work instead.
- Isolate tests that would affect `$HOME`, editor plugins, tmux sessions, package state, or other user data. Use temporary directories/configuration, capture the real program's diagnostics, and clean up afterward.
- After edits, run and surface quick, relevant sanity checks such as `git diff --check`, `bash -n`, and focused tool-specific validation. Report whether changes are staged, unstaged, committed, or pushed.
- **Verify commands before encoding them in instructions.** Tool availability and wrappers change between sessions, so run the command now instead of trusting stale guidance, and don't write old toolchain assumptions into prompt or handoff files.
