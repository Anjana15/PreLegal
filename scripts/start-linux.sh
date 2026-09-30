#!/usr/bin/env bash
# Build and start PreLegal in Docker, then wait until it is healthy.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose up --build --detach --wait
echo "PreLegal is running at http://localhost:8000"
