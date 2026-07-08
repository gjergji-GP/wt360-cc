#!/usr/bin/env bash
# WT360 documentation CI check. Zero deps beyond coreutils + grep.
# Contract/domain/workspace docs: require Status + Version + Last Updated.
# ADRs: require Status (Accepted/Proposed/Superseded) + Date.
# Index files (README, TRACEABILITY, templates): skipped.
set -uo pipefail
DOCS_DIR="${1:-docs}"
fail=0

echo "== WT360 docs check =="

is_adr() { case "$1" in */adr/ADR-0*.md) [ "$(basename "$1")" != "ADR-000-template.md" ] && return 0;; esac; return 1; }

while IFS= read -r f; do
  base="$(basename "$f")"
  case "$base" in README.md|TRACEABILITY.md|ADR-000-template.md) continue;; esac

  if is_adr "$f"; then
    grep -qE '^Status: (Accepted|Proposed|Superseded)' "$f" || { echo "ADR STATUS INVALID: $f"; fail=1; }
    grep -q '^Date:' "$f" || { echo "ADR MISSING Date: $f"; fail=1; }
  else
    for field in "Status:" "Version:" "Last Updated:"; do
      grep -q "^$field" "$f" || { echo "MISSING METADATA: $f (no '$field')"; fail=1; }
    done
  fi
done < <(find "$DOCS_DIR" -name '*.md' -type f)

# Relative links resolve
while IFS= read -r f; do
  dir="$(dirname "$f")"
  grep -oE '\]\(([^)]+)\)' "$f" | sed -E 's/^\]\(//; s/\)$//' | while IFS= read -r link; do
    case "$link" in http*|\#*|mailto:*) continue;; esac
    target="${link%%#*}"; [ -z "$target" ] && continue
    [ -e "$dir/$target" ] || [ -e "$DOCS_DIR/$target" ] || { echo "BROKEN LINK: $f -> $link"; fail=1; }
  done
done < <(find "$DOCS_DIR" -name '*.md' -type f)

[ "$fail" -eq 0 ] && echo "OK: metadata present, links resolve, ADR statuses valid." || echo "FAILED: see above."
exit $fail
