# 🔧 Debug Connexion Tenant Admin

## ⚠️ Erreur `ERR_BLOCKED_BY_CLIENT`

Cette erreur signifie que **une extension de navigateur bloque la requête** vers l'API.

### Solutions

1. **Désactiver les bloqueurs de publicité** (uBlock Origin, AdBlock, etc.)
   - Désactivez-les temporairement pour tester
   - Ou ajoutez `localhost:9495` en liste blanche

2. **Vérifier que le backend est démarré**
   ```bash
   docker ps | grep vtcbuilder_backend
   ```

3. **Tester l'API directement avec curl**
   ```bash
   curl -X POST http://localhost:9495/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@masociete-vtc.com","password":"admin123"}'
   ```

4. **Vérifier les CORS dans le backend**
   - Le frontend est sur `http://localhost:9494`
   - L'API est sur `http://localhost:9495`
   - Les CORS doivent autoriser `http://localhost:9494`

## 🔐 Vérification du Compte Tenant Admin

### Compte de test
- **Email** : `admin@masociete-vtc.com`
- **Mot de passe** : `admin123`
- **Tenant** : Ma Société VTC (slug: `ma-societe-vtc`)

### Si le mot de passe ne fonctionne pas

1. **Réinitialiser le mot de passe via l'interface super admin** :
   - Connectez-vous en tant que super admin
   - Allez dans Admin > Tenants > [Tenant]
   - Section "Informations Admin (Debug)"
   - Cliquez sur "Réinitialiser" avec le mot de passe souhaité

2. **Ou via la ligne de commande** :
   ```bash
   docker exec vtcbuilder_backend python manage.py fix_test_tenant --password admin123
   ```

## 🧪 Test de Connexion

### Test backend
```bash
curl -X POST http://localhost:9495/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@masociete-vtc.com","password":"admin123"}'
```

**Résultat attendu** :
```json
{
  "user": {
    "id": 6,
    "email": "admin@masociete-vtc.com",
    ...
  },
  "tokens": {
    "access": "...",
    "refresh": "..."
  }
}
```

### Si curl fonctionne mais pas le navigateur

C'est un problème de bloqueur d'extensions. Solutions :
1. Testez dans un **navigateur en mode navigation privée** (extensions désactivées)
2. Ou **désactivez temporairement les extensions**
3. Ou utilisez un **autre navigateur** sans extensions

## ✅ Vérification Complète

Exécutez cette commande pour vérifier l'état du tenant :
```bash
docker exec vtcbuilder_backend python manage.py shell
```

Puis dans le shell Python :
```python
from tenants.models import Tenant, User
from django.contrib.auth import authenticate

tenant = Tenant.objects.get(slug='ma-societe-vtc')
admin = User.objects.filter(tenant=tenant, role='tenant-admin').first()

print(f"Tenant: {tenant.name}")
print(f"Admin: {admin.email if admin else 'None'}")
print(f"Status: {admin.status if admin else 'None'}")

# Test auth
result = authenticate(username=admin.email, password='admin123')
print(f"Auth: {'OK' if result else 'FAILED'}")
```

## 🔄 Réinitialisation Complète

Si rien ne fonctionne, réinitialisez complètement :
```bash
docker exec vtcbuilder_backend python manage.py fix_test_tenant --password admin123
```

---

**Date** : 2025-11-26  
**Status** : ✅ Backend fonctionnel, problème côté navigateur

