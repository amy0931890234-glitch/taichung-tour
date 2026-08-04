New-Item -ItemType Directory -Force -Path 'c:\Users\ASUS\Desktop\AI\temp_deploy' | Out-Null
Copy-Item -Path 'c:\Users\ASUS\Desktop\AI\美東九月慢活家庭自然之旅行程指南.html' -Destination 'c:\Users\ASUS\Desktop\AI\temp_deploy\index.html' -Force
Remove-Item -Path 'c:\Users\ASUS\Desktop\AI\site.zip' -ErrorAction SilentlyContinue
Compress-Archive -Path 'c:\Users\ASUS\Desktop\AI\temp_deploy\*' -DestinationPath 'c:\Users\ASUS\Desktop\AI\site.zip' -Force

$bytes = [System.IO.File]::ReadAllBytes('c:\Users\ASUS\Desktop\AI\site.zip')
$res = Invoke-RestMethod -Uri 'https://api.netlify.com/api/v1/sites' -Method Post -Body $bytes -ContentType 'application/zip'

Write-Host "DEPLOYED_LIVE_URL:" $res.ssl_url
