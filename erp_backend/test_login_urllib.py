import urllib.request
import json

url = 'http://localhost:8000/api/token/'
creds_list = [
    {'payload': {'username': 'ceo@kaizen.com', 'password': 'password123'}, 'name': 'Payload: username'},
    {'payload': {'email': 'ceo@kaizen.com', 'password': 'password123'}, 'name': 'Payload: email'}
]

for c in creds_list:
    try:
        data = json.dumps(c['payload']).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            print(f"{c['name']} -> Status: {response.getcode()}")
            if response.getcode() == 200:
                print("  Success! Token received.")
    except urllib.error.HTTPError as e:
        print(f"{c['name']} -> Failed: {e.code} {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"{c['name']} -> Error: {e}")
