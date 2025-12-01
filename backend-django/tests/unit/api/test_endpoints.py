"""
Tests pour tous les endpoints de l'API
"""
import os
import sys
import django

# Configuration Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtcbuilder.settings')
django.setup()

# Charger les variables d'environnement avec decouple
try:
    from decouple import config
except ImportError:
    # Fallback si decouple n'est pas disponible
    def config(key, default=None):
        return os.getenv(key, default)

import requests
import json

# Variables d'environnement pour les tests
BASE_URL = config('TEST_API_URL', default='http://localhost:9495/api')
TEST_EMAIL = config('TEST_EMAIL', default='admin@vtcbuilder.com')
TEST_PASSWORD = config('TEST_PASSWORD', default='admin123')

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.results = {
            'passed': [],
            'failed': []
        }
    
    def login(self):
        """Se connecter et obtenir le token"""
        try:
            response = self.session.post(
                f'{BASE_URL}/auth/login/',
                json={'email': TEST_EMAIL, 'password': TEST_PASSWORD},
                headers={'Content-Type': 'application/json'}
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token') or data.get('access')
                if self.token:
                    self.session.headers.update({'Authorization': f'Bearer {self.token}'})
                return True
            return False
        except Exception as e:
            print(f"❌ Erreur login: {e}")
            return False
    
    def test_endpoint(self, method, endpoint, name, data=None, expected_status=200):
        """Tester un endpoint"""
        try:
            url = f'{BASE_URL}{endpoint}'
            if method.upper() == 'GET':
                response = self.session.get(url)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data)
            elif method.upper() == 'PATCH':
                response = self.session.patch(url, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url)
            else:
                response = self.session.request(method, url, json=data)
            
            if response.status_code == expected_status:
                self.results['passed'].append(f"{name} ({method} {endpoint})")
                return True
            else:
                error_msg = f"Status {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg = error_data.get('error', error_data.get('message', error_msg))
                except:
                    error_msg = response.text[:100]
                
                self.results['failed'].append({
                    'name': f"{name} ({method} {endpoint})",
                    'status': response.status_code,
                    'error': error_msg
                })
                return False
        except Exception as e:
            self.results['failed'].append({
                'name': f"{name} ({method} {endpoint})",
                'error': str(e)
            })
            return False
    
    def run_all_tests(self):
        """Exécuter tous les tests"""
        print("🔍 Test: Login")
        if not self.login():
            print("  ❌ Login échoué - Impossible de continuer")
            return
        
        print(f"  ✅ Login (HTTP 200)")
        
        # Tests des endpoints principaux
        endpoints = [
            # Dashboard
            ('GET', '/dashboard/', 'Dashboard'),
            ('GET', '/dashboard', 'Dashboard (no slash)'),
            
            # Stats
            ('GET', '/stats/detailed/', 'Stats détaillées'),
            ('GET', '/stats/detailed', 'Stats détaillées (no slash)'),
            
            # System Settings
            ('GET', '/system-settings/', 'System Settings'),
            ('GET', '/system-settings', 'System Settings (no slash)'),
            
            # Tenants
            ('GET', '/tenants/', 'Tenants'),
            ('GET', '/tenants', 'Tenants (no slash)'),
            
            # Users
            ('GET', '/users/', 'Users'),
            ('GET', '/users', 'Users (no slash)'),
            ('GET', '/users/impersonation-status/', 'Impersonation Status'),
            ('GET', '/users/impersonation-status', 'Impersonation Status (no slash)'),
            
            # Pages
            ('GET', '/pages/', 'Pages'),
            ('GET', '/pages', 'Pages (no slash)'),
            
            # Services
            ('GET', '/services/', 'Services'),
            ('GET', '/services', 'Services (no slash)'),
            
            # Bookings
            ('GET', '/bookings/', 'Bookings'),
            ('GET', '/bookings', 'Bookings (no slash)'),
            
            # Media
            ('GET', '/media/', 'Media'),
            ('GET', '/media', 'Media (no slash)'),
            
            # Templates
            ('GET', '/templates/', 'Templates'),
            ('GET', '/templates', 'Templates (no slash)'),
            
            # Blocks
            ('GET', '/blocks/types/', 'Block Types'),
            ('GET', '/blocks/types', 'Block Types (no slash)'),
            ('GET', '/blocks/templates/', 'Block Templates'),
            ('GET', '/blocks/templates', 'Block Templates (no slash)'),
            
            # Billing
            ('GET', '/pricing-plans/', 'Pricing Plans'),
            ('GET', '/pricing-plans', 'Pricing Plans (no slash)'),
            ('GET', '/subscriptions/', 'Subscriptions'),
            ('GET', '/subscriptions', 'Subscriptions (no slash)'),
            ('GET', '/invoices/', 'Invoices'),
            ('GET', '/invoices', 'Invoices (no slash)'),
            ('GET', '/payments/', 'Payments'),
            ('GET', '/payments', 'Payments (no slash)'),
            ('GET', '/payment-methods/', 'Payment Methods'),
            ('GET', '/payment-methods', 'Payment Methods (no slash)'),
            ('GET', '/billing/stats/', 'Billing Stats'),
            ('GET', '/billing/stats', 'Billing Stats (no slash)'),
            ('GET', '/billing/unpaid-items/', 'Billing Unpaid Items'),
            ('GET', '/billing/unpaid-items', 'Billing Unpaid Items (no slash)'),
            
            # Analytics
            ('POST', '/analytics/block-usage/', 'Block Usage Tracking', {'usages': []}),
            ('POST', '/analytics/block-usage', 'Block Usage Tracking (no slash)', {'usages': []}),
        ]
        
        for endpoint in endpoints:
            method = endpoint[0]
            path = endpoint[1]
            name = endpoint[2]
            data = endpoint[3] if len(endpoint) > 3 else None
            expected = endpoint[4] if len(endpoint) > 4 else 200
            
            print(f"\n🔍 Test: {name}")
            self.test_endpoint(method, path, name, data, expected)
        
        # Afficher les résultats
        print("\n" + "="*60)
        print("📊 RÉSULTATS DES TESTS")
        print("="*60)
        print(f"\n✅ Réussis: {len(self.results['passed'])}")
        for test in self.results['passed']:
            print(f"  ✅ {test}")
        
        print(f"\n❌ Échoués: {len(self.results['failed'])}")
        for test in self.results['failed']:
            print(f"  ❌ {test['name']}")
            if 'status' in test:
                print(f"     Status: {test['status']}")
            if 'error' in test:
                print(f"     Erreur: {test['error']}")
        
        print("\n" + "="*60)

if __name__ == '__main__':
    # Afficher les variables utilisées (sans le mot de passe complet)
    print("="*60)
    print("🧪 CONFIGURATION DES TESTS")
    print("="*60)
    print(f"📡 API URL: {BASE_URL}")
    print(f"📧 Email de test: {TEST_EMAIL}")
    print(f"🔑 Mot de passe: {'*' * len(TEST_PASSWORD)}")
    print("="*60)
    print()
    
    tester = APITester()
    tester.run_all_tests()

