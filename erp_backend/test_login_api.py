import requests

url = 'http://localhost:8000/api/token/'
creds = [
    {'payload': {'username': 'ceo@kaizen.com', 'password': 'password123'}, 'name': 'Payload: username'},
    {'payload': {'email': 'ceo@kaizen.com', 'password': 'password123'}, 'name': 'Payload: email'}
]

for c in creds:
    try:
        r = requests.post(url, json=c['payload'])
        print(f"{c['name']} -> Status: {r.status_code}")
        if r.status_code == 200:
            print("  Success! Token received.")
        else:
            print(f"  Failed: {r.text}")
    except Exception as e:
        print(f"{c['name']} -> Error: {e}")
