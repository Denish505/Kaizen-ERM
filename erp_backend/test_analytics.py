from rest_framework.test import APIClient
from apps.hrm.models import Employee
import json
import decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return super().default(obj)

try:
    emp = Employee.objects.filter(user__role='ceo').first()
    client = APIClient()
    client.force_authenticate(user=emp.user)
    res = client.get('/api/reports/analytics/overview/', format='json', SERVER_NAME='127.0.0.1')
    print("Status:", res.status_code)
    print(json.dumps(res.data, cls=DecimalEncoder, indent=2))
except Exception as e:
    print(e)
