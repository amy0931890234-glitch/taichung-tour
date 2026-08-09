import urllib.request
import json
import zipfile
import os

zip_path = r'c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026\site_deploy.zip'
html_path = r'c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026\index.html'

print("Zipping file...")
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.write(html_path, 'index.html')

print("Uploading to Netlify API...")
with open(zip_path, 'rb') as f:
    data = f.read()

req = urllib.request.Request(
    'https://api.netlify.com/api/v1/sites',
    data=data,
    headers={'Content-Type': 'application/zip'}
)

try:
    with urllib.request.urlopen(req) as res:
        result = json.loads(res.read().decode('utf-8'))
        live_url = result.get('ssl_url') or result.get('url')
        site_name = result.get('name')
        print(f"DEPLOYMENT_SUCCESSFUL: {live_url}")
        with open(r'c:\Users\user\.gemini\antigravity-ide\scratch\us-east-trip-2026\live_url.txt', 'w', encoding='utf-8') as out:
            out.write(f"Live URL: {live_url}\nSite Name: {site_name}\n")
except Exception as e:
    print("DEPLOY_ERROR:", e)
