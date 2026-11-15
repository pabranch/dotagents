# PowerShell

> **Read when:** explaining, configuring, or running PowerShell commands.

## Background

- Perry's CLI experience is almost exclusively *nix (primarily Linux and macOS). His muscle memory for core *nix utilities goes back decades.
- `git-bash` is installed, and most of his local environment is configured through it.
- He is exploring PowerShell. His `$PROFILE` mimics his *nix setup as idiomatically as PowerShell allows.

## Guidance

- When explaining PowerShell, relate it to the *nix equivalent he already knows.
- Prefer idiomatic PowerShell. Point out where PowerShell behavior differs from *nix, for example object pipelines vs. text streams.
- Check how a *nix-named PowerShell command behaves before assuming it matches an alias or Unix utility.
- The interactive `$PROFILE` may rewrite commands to Microsoft Coreutils when installed; check both Coreutils availability and whether the profile is active. `Get-Command` alone does not show the rewrite performed by `PSConsoleHostReadLine`.
