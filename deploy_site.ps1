$workspace = "c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026"
$tempDir = Join-Path $workspace "temp_deploy"
$zipPath = Join-Path $workspace "site_deploy.zip"
$htmlPath = Join-Path $workspace "index.html"

if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
Copy-Item -Path $htmlPath -Destination (Join-Path $tempDir "index.html") -Force

if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

$bytes = [System.IO.File]::ReadAllBytes($zipPath)
$res = Invoke-RestMethod -Uri 'https://api.netlify.com/api/v1/sites' -Method Post -Body $bytes -ContentType 'application/zip'

Write-Host "DEPLOYED_LIVE_URL:" $res.ssl_url
Set-Content -Path (Join-Path $workspace "live_url.txt") -Value "Live URL: $($res.ssl_url)`nSite ID: $($res.id)`nSite Name: $($res.name)"
