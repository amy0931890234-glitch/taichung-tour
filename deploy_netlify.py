import urllib.request
import json
import zipfile
import os

zip_path = r'c:\Users\ASUS\Desktop\AI\deploy_site.zip'
html_path = r'c:\Users\ASUS\Desktop\AI\美東九月慢活家庭自然之旅行程指南.html'

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.write(html_path, 'index.html')

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
        print("DEPLOYED_URL:", result.get('ssl_url') or result.get('url'))
except Exception as e:
    print("DEPLOY_ERROR:", e)
