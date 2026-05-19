#!/usr/bin/env bash
set -euo pipefail

resolve_cli() {
  local skill_dir repo_root
  skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  repo_root="$(cd "$skill_dir/../.." && pwd)"

  if [[ -f "$repo_root/package.json" && -f "$repo_root/dist/index.js" ]] \
    && grep -q '"name"[[:space:]]*:[[:space:]]*"ftp-uploader"' "$repo_root/package.json" 2>/dev/null; then
    echo "node" "$repo_root/dist/index.js"
    return
  fi

  if [[ -f "$skill_dir/package.json" && -f "$skill_dir/dist/index.js" ]]; then
    echo "node" "$skill_dir/dist/index.js"
    return
  fi

  echo "npx" "--yes" "github:Rayzzhu/ftp-uploader"
}

read -r -a runner <<< "$(resolve_cli)"
exec "${runner[@]}" "$@"
