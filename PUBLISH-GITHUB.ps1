$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$repo = "https://github.com/aalbertsberg-dotcom/SelfieSign.git"
$pages = "https://aalbertsberg-dotcom.github.io/SelfieSign/"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git is not installed or is not in PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path .git)) {
    git init
    git branch -M main
}

Write-Host "Preparing public QR codes..." -ForegroundColor Cyan
python .\scripts\generate-public-qrs.py
if ($LASTEXITCODE -ne 0) { throw "Could not generate public QR codes." }

git add .
$changes = git status --porcelain
if ($changes) {
    git commit -m "Update Ink & Flash website"
} else {
    Write-Host "No new file changes to commit." -ForegroundColor Yellow
}

$remoteNames = @(git remote)
if ($remoteNames -notcontains "origin") {
    git remote add origin $repo
} else {
    $origin = git remote get-url origin
    if ($origin -ne $repo) { git remote set-url origin $repo }
}

git push -u origin main
Write-Host "" 
Write-Host "Push complete." -ForegroundColor Green
Write-Host "GitHub Pages URL: $pages" -ForegroundColor Cyan
Write-Host "If this is the first push, enable Pages once: Settings -> Pages -> Deploy from a branch -> main -> /(root)." -ForegroundColor Yellow
