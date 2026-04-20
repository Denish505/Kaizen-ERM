import requests
import json

# Test backend login endpoint
url = "http://localhost:8000/api/token/"
data = {
    "email": "ceo@kaizen.com",
    "password": "password123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        # Try to get user data
        token = response.json()["access"]
        headers = {"Authorization": f"Bearer {token}"}
        user_response = requests.get("http://localhost:8000/api/users/me/", headers=headers)
        print(f"\nUser Data Status: {user_response.status_code}")
        if user_response.status_code == 200:
            print(f"User Data: {json.dumps(user_response.json(), indent=2)}")
        else:
            print(f"User Data Error: {user_response.text}")
except Exception as e:
    print(f"Error: {str(e)}")
