from auth_service import login_user

test_passwords = [
    'Password123',
    'password123',
    'Test123456',
    'Hari123456',
    'Admin123!',
    'Changeme123',
    'Developer@123',
    'SecurePass1',
]

email = 'routhariprasad5@gmail.com'

print("Testing various passwords...")
for pwd in test_passwords:
    try:
        result = login_user(email, pwd)
        print(f'\n✓ SUCCESS with password: {pwd}')
        print(f'  Token: {result["token"][:30]}...')
        print(f'  User: {result["user"]}')
        break
    except ValueError:
        print(f'  ✗ {pwd:20} - Failed')
    except Exception as e:
        print(f'  ! {pwd:20} - Error: {e}')
