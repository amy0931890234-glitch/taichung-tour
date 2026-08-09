New-Item -ItemType Directory -Force -Path 'c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026\temp_deploy' | Out-Null
Copy-Item -Path 'c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026\index.html' -Destination 'c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026\temp_deploy\index.html' -Force
Remove-Item -Path 'c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026\site.zip' -ErrorAction SilentlyContinue
Compress-Archive -Path 'c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026\temp_deploy\*' -DestinationPath 'c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026\site.zip' -Force

$bytes = [System.IO.File]::ReadAllBytes('c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026\site.zip')
$res = Invoke-RestMethod -Uri 'https://api.netlify.com/api/v1/sites' -Method Post -Body $bytes -ContentType 'application/zip'

Write-Host "DEPLOYED_LIVE_URL:" $res.ssl_url
$res.ssl_url | Out-File -FilePath 'c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026\live_url.txt' -Encoding utf8
