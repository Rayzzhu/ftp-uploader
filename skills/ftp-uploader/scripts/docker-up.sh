#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$repo_root"

if [[ ! -f docker-compose.yml ]]; then
  echo "docker-compose.yml not found at $repo_root" >&2
  exit 1
fi

docker compose up -d --build
echo "SFTP test server: 127.0.0.1:2222 (testuser / testpass)"
