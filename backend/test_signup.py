from auth_service import signup_user, login_user
from database import get_db

# Create a test user
try:
    result = signup_user('TestUser', 'test@example.com', 'TestPass123')
    print("✓ Signup successful:")
    print(f"  Token: {result['token'][:50]}...")
    print(f"  User: {result['user']}")
    print()
    
    # Now try to login with that user
    login_result = login_user('test@example.com', 'TestPass123')
    print("✓ Login successful:")
    print(f"  Token: {login_result['token'][:50]}...")
    print(f"  User: {login_result['user']}")
except Exception as e:
    print(f"✗ Error: {e}")

# List all users
print("\nAll users in database:")
db = get_db()
users = db.execute('SELECT id, username, email FROM users').fetchall()
for u in users:
    print(f"  ID {u[0]}: {u[1]} ({u[2]})")
db.close()
