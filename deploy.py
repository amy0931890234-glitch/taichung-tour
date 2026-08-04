import os
import zipfile
import urllib.request
import json

# Zip the maryland_tour_2026 directory
folder_path = r'c:\Users\ASUS\Desktop\AI\maryland_tour_2026'
zip_path = r'c:\Users\ASUS\Desktop\AI\maryland_tour_2026.zip'

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, folder_path)
            zipf.write(file_path, arcname)

print("ZIP created successfully at:", zip_path)
