import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:8000"

# First get a token
print("1. Testing POST /api/login...")
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
        body = json.loads(response.read().decode('utf-8'))
        token = body['token']
        print(f"✓ Got token: {token[:50]}...")
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

# Now test protected endpoint
print("\n2. Testing GET /api/auth/me with token...")
try:
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/me",
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )
    
    with urllib.request.urlopen(req) as response:
        body = json.loads(response.read().decode('utf-8'))
        print(f"✓ Status: 200")
        print(f"✓ Response:")
        print(json.dumps(body, indent=2))
except urllib.error.HTTPError as e:
    print(f"✗ HTTP Error: {e.code}")
    print(f"Response:")
    print(json.dumps(json.loads(e.read().decode('utf-8')), indent=2))
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")

# Test without token
print("\n3. Testing GET /api/auth/me WITHOUT token...")
try:
    req = urllib.request.Request(f"{BASE_URL}/api/auth/me")
    with urllib.request.urlopen(req) as response:
        print(f"✗ Should have failed!")
except urllib.error.HTTPError as e:
    print(f"✓ HTTP Error (expected): {e.code}")
    try:
        body = json.loads(e.read().decode('utf-8'))
        print(f"Response: {json.dumps(body, indent=2)}")
    except:
        print(f"(Could not parse response)")
