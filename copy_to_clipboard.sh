#!/usr/bin/env bash

# Configuration
IGNORE_FILES=("pnpm-lock.yaml")

# Function to check if a file should be ignored
should_ignore() {
  [[ " ${IGNORE_FILES[*]} " =~ " $1 " ]] || git check-ignore -q "$1"
}

# Main function to process and copy files
copy_files() {
  git ls-files -co --exclude-standard | 
    while IFS= read -r file; do
      if [[ -f "$file" && ! $(should_ignore "$file") ]]; then
        echo -e "\n#filename $file\n"
        cat "$file"
      fi
    done | pbcopy

  echo "Contents of all non-ignored files have been copied to clipboard."
}

copy_files
