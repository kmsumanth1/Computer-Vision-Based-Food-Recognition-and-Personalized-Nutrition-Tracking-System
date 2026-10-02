import requests
import time
import numpy as np

url = "http://127.0.0.1:8000/ping"  # change port if yours is different
times = []

for i in range(20):
    start = time.perf_counter()
    response = requests.get(url)
    elapsed_ms = (time.perf_counter() - start) * 1000
    times.append(elapsed_ms)
    print(f"Request {i+1}: {elapsed_ms:.2f} ms")

print("\nMean API response time:", np.mean(times), "ms")
print("Std Dev:", np.std(times), "ms")
print("Median:", np.median(times), "ms")