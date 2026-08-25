param([Parameter(Mandatory=$true)][string]$RepoUrl)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
if (-not (Test-Path .git)) { git init; git branch -M main }
git add .
$hasHead = git rev-parse --verify HEAD 2>$null
if ($LASTEXITCODE -ne 0) { git commit -m "Initial Sign Selfie Send site" } else { git commit -m "Update Sign Selfie Send site" }
$remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) { git remote add origin $RepoUrl } else { git remote set-url origin $RepoUrl }
git push -u origin main
