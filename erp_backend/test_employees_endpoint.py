import requests
import json

BASE_URL = 'http://localhost:8000/api'

# Login
print("=== Testing Employee Endpoint ===\n")
print("Step 1: Logging in...")
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

# Test Employees endpoint
print("Step 2: Fetching employees...")
response = requests.get(
    f'{BASE_URL}/hrm/employees/',
    headers=headers
)

print(f"   Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"   ✅ SUCCESS: Found {len(data)} employees")
    if len(data) > 0:
        print(f"   Sample employee: {data[0].get('user', {}).get('first_name', 'N/A')}")
else:
    print(f"   ❌ FAIL: {response.text}")

print("\n=== Test Complete ===")
