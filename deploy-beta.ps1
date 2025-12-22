param (
    [string]$BetaRoot = "D:\AgeOfBotsGames - BETA\beta_package_v4_5_10_BETA\beta_package",
    [string]$GameFile = "habib_punja_v5_1_0.html",
    [string]$CommitMessage = "Deploy Beta to Live"
)

Write-Host "Deploying Beta → Live repo..." -ForegroundColor Cyan
Write-Host "BetaRoot: $BetaRoot" -ForegroundColor DarkGray

if (!(Test-Path $BetaRoot)) {
    throw "BetaRoot not found: $BetaRoot"
}

# Ensure production folder exists in the repo
if (!(Test-Path ".\production")) {
    New-Item -ItemType Directory -Path ".\production" | Out-Null
}

$files = @(
    "accessibility.html",
    "index.html",
    "resources.html",
    "characters.html",
    "contact.html",
    "source-selection-criteria.html",
    "strategic-guide.html"
)

foreach ($file in $files) {
    $src = Join-Path $BetaRoot $file
    $dst = Join-Path (Get-Location) $file

    if (!(Test-Path $src)) {
        throw "Missing source file: $src"
    }

    Copy-Item $src -Destination $dst -Force
    Write-Host "✔ Copied $file" -ForegroundColor Green
}

# Copy game file
$gameSrc = Join-Path (Join-Path $BetaRoot "production") $GameFile
$gameDst = Join-Path (Join-Path (Get-Location) "production") $GameFile

if (!(Test-Path $gameSrc)) {
    throw "Missing game file: $gameSrc"
}

Copy-Item $gameSrc -Destination $gameDst -Force
Write-Host "✔ Copied production\$GameFile" -ForegroundColor Green

Write-Host "`nGit status:" -ForegroundColor Cyan
git status

Write-Host "`nStaging + commit + push..." -ForegroundColor Cyan
git add .
git commit -m $CommitMessage
git push origin main

Write-Host "`n✅ Deployed! Site will update in ~1–2 minutes" -ForegroundColor Green
Write-Host "Test: https://ageofbotsgames.com" -ForegroundColor Cyan

