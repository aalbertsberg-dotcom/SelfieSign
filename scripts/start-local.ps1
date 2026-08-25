$ErrorActionPreference = "Continue"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Checking Python..." -ForegroundColor Cyan
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Python was not found in PATH." -ForegroundColor Red
    Write-Host "Install Python, then run this launcher again."
    exit 1
}

python -c "import qrcode" *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing the local QR dependency..." -ForegroundColor Yellow
    python -m pip install -r .\requirements.txt
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Starting Ink & Flash on port 5500..." -ForegroundColor Green
python .\scripts\server.py --port 5500
