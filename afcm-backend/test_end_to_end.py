import requests
import time
import numpy as np

BASE_URL = "http://127.0.0.1:8000"

# --- 1. Log in ---
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "testuser@example.com",   # same credentials as your other scripts
    "password": "TestPass123"
})
if login_resp.status_code != 200:
    print("Login failed:", login_resp.status_code, login_resp.text)
    exit(1)

token = login_resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# --- 2. Call /food/analyze repeatedly, timing the FULL request ---
image_path = "test_images/food1.jpg"
num_requests = 20
times = []

for i in range(num_requests):
    with open(image_path, "rb") as f:
        files = {"image": ("food1.jpg", f, "image/jpeg")}
        start = time.perf_counter()
        response = requests.post(f"{BASE_URL}/food/analyze", headers=headers, files=files)
        elapsed_ms = (time.perf_counter() - start) * 1000
    times.append(elapsed_ms)
    print(f"Request {i+1}: status {response.status_code}, {elapsed_ms:.2f} ms")

# --- 3. Stats ---
print(f"\nCollected {len(times)} samples")
print("Mean end-to-end time:", np.mean(times), "ms")
print("Std Dev:", np.std(times), "ms")
print("Median:", np.median(times), "ms")