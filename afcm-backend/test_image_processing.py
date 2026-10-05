import requests
import csv
import numpy as np
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"

# --- 1. Log in to get a token ---
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "testuser@example.com",   # replace with a real registered user
    "password": "TestPass123"          # replace with that user's password
})

if login_resp.status_code != 200:
    print("Login failed:", login_resp.status_code, login_resp.text)
    exit(1)

token = login_resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# --- 2. Clear old timing file so results aren't mixed with a previous run ---
timing_file = Path("image_processing_times.csv")
if timing_file.exists():
    timing_file.unlink()

# --- 3. Call /food/analyze repeatedly with a test image ---
image_path = "test_images/food1.jpg"  # make sure this file exists relative to where you run the script

num_requests = 20
for i in range(num_requests):
    with open(image_path, "rb") as f:
        files = {"image": ("food1.jpg", f, "image/jpeg")}
        response = requests.post(f"{BASE_URL}/food/analyze", headers=headers, files=files)
    print(f"Request {i+1}: status {response.status_code}")

# --- 4. Read timings the backend wrote and compute stats ---
times = []
with open(timing_file) as f:
    reader = csv.DictReader(f)
    for row in reader:
        times.append(float(row["elapsed_ms"]))

if not times:
    print("\nNo timings recorded — check that requests succeeded (status 200).")
else:
    print(f"\nCollected {len(times)} timing samples")
    print("Mean image processing time:", np.mean(times), "ms")
    print("Std Dev:", np.std(times), "ms")
    print("Median:", np.median(times), "ms")