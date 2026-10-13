#!/usr/bin/env bash
# Archive a pi session: export it to HTML, then compress it into a .tgz.
set -euo pipefail

usage() {
	cat <<'EOF'
Usage: archive-session.sh [session] [output-dir]

Export a pi session to HTML and compress it into a .tgz archive.

  session      Session file path, session ID, or session name.
               Defaults to $PI_SESSION_FILE (the current session).
  output-dir   Directory for the .tgz. Defaults to the current directory.

Prints the created archive path. The source session is left untouched.
EOF
}

case "${1:-}" in
	-h | --help)
		usage
		exit 0
		;;
esac

session="${1:-${PI_SESSION_FILE:-}}"
outdir="${2:-$PWD}"

if [[ -z "$session" ]]; then
	echo "error: no session given and PI_SESSION_FILE is unset" >&2
	usage >&2
	exit 2
fi

agent_dir="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
session_dir="${PI_CODING_AGENT_SESSION_DIR:-$agent_dir/sessions}"

# Resolve the session argument to a file path.
if [[ -f "$session" ]]; then
	session_file="$session"
else
	matches=()
	while IFS= read -r f; do
		[[ -n "$f" ]] || continue
		if [[ "$(basename "$f")" == *"$session"* ]] ||
			grep -qF "\"name\":\"$session\"" "$f" 2>/dev/null; then
			matches+=("$f")
		fi
	done < <(find "$session_dir" -type f -name '*.jsonl' ! -name '*.bak-*' 2>/dev/null)
	case "${#matches[@]}" in
		0)
			echo "error: no session matching '$session' under $session_dir" >&2
			exit 1
			;;
		1) session_file="${matches[0]}" ;;
		*)
			echo "error: '$session' matches multiple sessions:" >&2
			printf '  %s\n' "${matches[@]}" >&2
			exit 1
			;;
	esac
fi

# Derive the display name and start date from the session file.
mapfile -t meta < <(python3 - "$session_file" <<'PY'
import json
import sys

name = ""
stamp = ""
with open(sys.argv[1], encoding="utf-8", errors="replace") as fh:
    for line in fh:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        ts = obj.get("timestamp", "")
        if not stamp and ts:
            stamp = ts[:10]
        if obj.get("type") == "session_info" and obj.get("name"):
            name = obj["name"]
print(name)
print(stamp)
PY
)
name="${meta[0]:-}"
stamp="${meta[1]:-}"

slug="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
if [[ -z "$slug" ]]; then
	slug="$(basename "$session_file" .jsonl)"
fi
[[ -n "$stamp" ]] || stamp="$(date +%Y-%m-%d)"

pi_bin="$(command -v pi || true)"
if [[ -z "$pi_bin" ]]; then
	echo "error: pi executable not found on PATH" >&2
	exit 1
fi

mkdir -p "$outdir"
archive="$outdir/${slug}-${stamp}.tgz"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

html="$tmpdir/${slug}.html"
"$pi_bin" --export "$session_file" "$html" >&2

tar -czf "$archive" -C "$tmpdir" "$(basename "$html")"

printf '%s\n' "$archive"
