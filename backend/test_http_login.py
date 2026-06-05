import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:8000"

# Test login
print("Testing POST /api/login...")
try:
    payload = json.dumps({
        "email": "test@example.com",
        "password": "TestPass123"
    }).encode('utf-8')
    
    req = urllib.request.Request(
        f"{BASE_URL}/api/login",
        data=payload,
        headers={'Content-Type': 'application/json'}
    )
    
    with urllib.request.urlopen(req) as response:
        status = response.status
        body = response.read().decode('utf-8')
        print(f"Status: {status}")
        print(f"Response:")
        print(json.dumps(json.loads(body), indent=2))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Response:")
    print(json.dumps(json.loads(e.read().decode('utf-8')), indent=2))
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
