#!/usr/bin/env bash
# Stop PreLegal. The database is recreated on the next start.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose down
