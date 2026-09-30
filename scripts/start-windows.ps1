# Build and start PreLegal in Docker, then wait until it is healthy.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
docker compose up --build --detach --wait
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "PreLegal is running at http://localhost:8000"
