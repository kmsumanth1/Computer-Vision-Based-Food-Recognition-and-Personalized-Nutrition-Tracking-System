import requests
import csv
import numpy as np

BASE_URL = "http://127.0.0.1:8000"

login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "testuser@example.com",   # use the same credentials from your earlier script
    "password": "TestPass123"
})
token = login_resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

barcode = "3017620422003"  # Nutella, known to exist on Open Food Facts

response = requests.post(f"{BASE_URL}/food/barcode", headers=headers, json={"barcode": barcode})
print("Status:", response.status_code)
print("Response:", response.json())

# Read the single timing the backend just wrote
with open("barcode_detection_times.csv") as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    print("\nLast recorded time:", rows[-1]["elapsed_ms"], "ms")