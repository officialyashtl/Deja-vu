from fastapi.testclient import TestClient
from main import app

with TestClient(app) as client:
    print('\n--- GET /health ---')
    print(client.get('/health').json())
    
    print('\n--- POST /analyze ---')
    print(client.post('/analyze', json={'finding_id': 'A-107', 'title': 'Delayed Employee Access Revocation', 'category': 'Access Control'}).json())
    
    print('\n--- POST /resolve ---')
    print(client.post('/resolve', json={'finding_id': 'A-107', 'resolution': 'Configured auto-termination scripts for AD.'}).json())
    
    print('\n--- GET /memory ---')
    print(client.get('/memory').json())
