import requests
import json

BASE_URL = 'http://localhost:8000/api'

# Login
print("=== Testing Password Change Endpoint ===\n")
print("Step 1: Logging in as ceo@kaizen.com...")
login_response = requests.post(f'{BASE_URL}/token/', json={
    'email': 'ceo@kaizen.com',
    'password': 'password123'
})

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.text}")
    exit(1)

access_token = login_response.json()['access']
print(f"✅ Login successful!\n")

headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

# Test 1: Wrong old password
print("Step 2: Testing with INCORRECT old password...")
response1 = requests.post(
    f'{BASE_URL}/users/change_password/',
    headers=headers,
    json={
        'old_password': 'wrongpassword999',
        'new_password': 'newpass123456'
    }
)

print(f"   Status: {response1.status_code}")
print(f"   Response: {json.dumps(response1.json(), indent=2)}")

if response1.status_code == 400:
    error_data = response1.json()
    if 'old_password' in error_data:
        print(f"   ✅ PASS: Correctly rejected wrong password\n")
    else:
        print(f"   ⚠️  WARN: Got 400 but unexpected error format\n")
else:
    print(f"   ❌ FAIL: Should have returned 400 Bad Request\n")

# Test 2: Correct old password
print("Step 3: Testing with CORRECT old password...")
response2 = requests.post(
    f'{BASE_URL}/users/change_password/',
    headers=headers,
    json={
        'old_password': 'password123',
        'new_password': 'tempnewpass123'
    }
)

print(f"   Status: {response2.status_code}")
print(f"   Response: {json.dumps(response2.json(), indent=2)}")

if response2.status_code == 200:
    print(f"   ✅ PASS: Password changed successfully\n")
    
    # Restore password
    print("Step 4: Restoring original password...")
    response3 = requests.post(
        f'{BASE_URL}/users/change_password/',
        headers=headers,
        json={
            'old_password': 'tempnewpass123',
            'new_password': 'password123'
        }
    )
    
    if response3.status_code == 200:
        print(f"   ✅ Password restored to original\n")
    else:
        print(f"   ❌ FAIL: Could not restore password!")
        print(f"   ⚠️  WARNING: CEO password is now 'tempnewpass123'\n")
else:
    print(f"   ❌ FAIL: Should have returned 200 OK\n")

print("=== Test Complete ===")
