import urllib.request
import urllib.error
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def test_endpoint(method, path, body=None, headers=None, expected_status=200, token=None):
    """Generic endpoint tester"""
    default_headers = {'Content-Type': 'application/json'}
    if token:
        default_headers['Authorization'] = f'Bearer {token}'
    if headers:
        default_headers.update(headers)
    
    try:
        payload = json.dumps(body).encode('utf-8') if body else None
        req = urllib.request.Request(
            f"{BASE_URL}{path}",
            data=payload,
            headers=default_headers,
            method=method
        )
        
        with urllib.request.urlopen(req) as response:
            status = response.status
            content = response.read().decode('utf-8')
            resp_json = json.loads(content) if content else {}
            
            if status == expected_status:
                print(f"{Colors.GREEN}✓{Colors.END} {method} {path} → {status}")
                return resp_json, status
            else:
                print(f"{Colors.YELLOW}⚠{Colors.END} {method} {path} → {status} (expected {expected_status})")
                return resp_json, status
                
    except urllib.error.HTTPError as e:
        status = e.code
        content = e.read().decode('utf-8')
        resp_json = json.loads(content) if content else {}
        
        if status == expected_status:
            print(f"{Colors.GREEN}✓{Colors.END} {method} {path} → {status}")
            return resp_json, status
        else:
            print(f"{Colors.RED}✗{Colors.END} {method} {path} → {status} (expected {expected_status})")
            print(f"  Response: {resp_json}")
            return resp_json, status

print(f"{Colors.BLUE}═══ FASTAPI ROUTE VALIDATION TESTS ═══{Colors.END}\n")

# Get login token
print(f"{Colors.BLUE}1. Authentication Routes{Colors.END}")
login_resp, _ = test_endpoint('POST', '/api/login', {
    'email': 'test@example.com',
    'password': 'TestPass123'
}, expected_status=200)
token = login_resp.get('token')

# Test protected endpoints
test_endpoint('GET', '/api/auth/me', token=token, expected_status=200)
test_endpoint('POST', '/api/logout', token=token, expected_status=200)

print(f"\n{Colors.BLUE}2. Session Routes{Colors.END}")
# Create session
session_resp, _ = test_endpoint('POST', '/api/sessions', token=token, expected_status=201)
session_id = session_resp.get('session', {}).get('id')

if session_id:
    test_endpoint('GET', f'/api/sessions/{session_id}', token=token, expected_status=200)
    test_endpoint('GET', '/api/history', token=token, expected_status=200)
    test_endpoint('PUT', f'/api/sessions/{session_id}', 
                 body={'title': 'Updated Session Title'}, 
                 token=token, expected_status=200)
    test_endpoint('DELETE', f'/api/sessions/{session_id}', token=token, expected_status=200)

print(f"\n{Colors.BLUE}3. User/Profile Routes{Colors.END}")
test_endpoint('GET', '/api/profile', token=token, expected_status=200)
test_endpoint('PUT', '/api/profile', 
             body={'username': 'TestUser', 'profile_picture': 'https://example.com/pic.jpg'},
             token=token, expected_status=200)
test_endpoint('GET', '/api/settings', token=token, expected_status=200)
test_endpoint('PUT', '/api/settings',
             body={
                 'notifications': {'email': True, 'browser': False},
                 'workspace_preferences': {'theme': 'dark'},
                 'security_preferences': {'twoFactor': False}
             },
             token=token, expected_status=200)
test_endpoint('GET', '/api/analytics', token=token, expected_status=200)

print(f"\n{Colors.BLUE}4. AI Routes (Session required){Colors.END}")
# Create new session for AI testing
session_resp, _ = test_endpoint('POST', '/api/sessions', token=token, expected_status=201)
ai_session_id = session_resp.get('session', {}).get('id')

if ai_session_id:
    test_endpoint('POST', '/api/ai/explain',
                 body={'session_id': ai_session_id, 'code': 'print("hello")', 'prompt': ''},
                 token=token, expected_status=200)

print(f"\n{Colors.BLUE}5. Health Check{Colors.END}")
test_endpoint('GET', '/api/health', expected_status=200)

print(f"\n{Colors.BLUE}6. Authentication Tests{Colors.END}")
test_endpoint('GET', '/api/auth/me', expected_status=403)  # No token
test_endpoint('POST', '/api/logout', expected_status=403)  # No token

print(f"\n{Colors.BLUE}═══ Tests Complete ═══{Colors.END}")
