#!/usr/bin/env bash

set -euo pipefail

# Configuration
IGNORE_PATTERNS=(
  "./pnpm-lock.yaml"
  "*.log"
  "*.tmp"
)

# Function to check if a file should be ignored
should_ignore() {
  local file="$1"
  for pattern in "${IGNORE_PATTERNS[@]}"; do
    if [[ "$file" == $pattern ]]; then
      echo "Ignoring $file (matches pattern $pattern)" >&2
      return 0
    fi
  done
  if git check-ignore -q "$file"; then
    echo "Ignoring $file (git-ignored)" >&2
    return 0
  fi
  return 1
}

# Main function to process and copy files
copy_files() {
  local temp_file=$(mktemp)
  
  {
    git ls-files -co --exclude-standard
    git ls-files --others --exclude-standard
  } | sort -u | while IFS= read -r file; do
    if [[ -f "$file" ]] && ! should_ignore "$file"; then
      echo -e "\n#filename $file\n" >> "$temp_file"
      cat "$file" >> "$temp_file"
    fi
  done

  if [[ -s "$temp_file" ]]; then
    pbcopy < "$temp_file"
    echo "Contents of all non-ignored files have been copied to clipboard."
  else
    echo "No files to copy."
  fi

  rm "$temp_file"
}

copy_files
