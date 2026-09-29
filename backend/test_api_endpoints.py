import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_endpoints():
    print("Testing GET /health")
    res = requests.get(f"{BASE_URL}/health")
    print("Status:", res.status_code)
    print("Response:", json.dumps(res.json(), indent=2))
    
    print("\nTesting GET /findings")
    res = requests.get(f"{BASE_URL}/findings")
    print("Status:", res.status_code)
    print("Response:", json.dumps(res.json(), indent=2))
    
    print("\nTesting POST /analyze")
    analyze_payload = {
        "finding_id": "A-107",
        "title": "Delayed Employee Access Revocation",
        "category": "Access Control"
    }
    res = requests.post(f"{BASE_URL}/analyze", json=analyze_payload)
    print("Status:", res.status_code)
    print("Response:", json.dumps(res.json(), indent=2))
    
    print("\nTesting POST /resolve")
    resolve_payload = {
        "finding_id": "A-107",
        "resolution": "Automated workflow integrated with HR system",
        "status": "Resolved"
    }
    res = requests.post(f"{BASE_URL}/resolve", json=resolve_payload)
    print("Status:", res.status_code)
    print("Response:", json.dumps(res.json(), indent=2))
    
    # Wait for the resolve to be embedded
    time.sleep(3)
    
    print("\nTesting GET /memory")
    res = requests.get(f"{BASE_URL}/memory")
    print("Status:", res.status_code)
    print("Response:", json.dumps(res.json(), indent=2))

if __name__ == "__main__":
    test_endpoints()
