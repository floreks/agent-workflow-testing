#!/usr/bin/env bash
set -euo pipefail

status=0

for file in skills/*/SKILL.md; do
  if [ ! -f "$file" ]; then
    continue
  fi

  if ! awk 'NR==1{exit($0=="---"?0:1)}' "$file"; then
    echo "ERROR: $file is missing starting frontmatter delimiter (---)." >&2
    status=1
    continue
  fi

  if ! awk '
    NR==1 {inside_meta=1; next}
    inside_meta && /^---$/ {close_found=1; inside_meta=0; next}
    inside_meta && /^name:[[:space:]]*[^[:space:]].*$/ {name=1}
    inside_meta && /^description:[[:space:]]*[^[:space:]].*$/ {description=1}
    END {if (!(close_found && name && description)) exit 1}
  ' "$file"; then
    echo "ERROR: $file frontmatter must include non-empty name and description fields before closing --- delimiter." >&2
    status=1
  fi
done

exit "$status"
