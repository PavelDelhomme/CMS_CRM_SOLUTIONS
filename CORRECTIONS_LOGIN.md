# 🔧 Corrections apportées pour le problème de login

## 🐛 Problème identifié

Lors de la connexion, le frontend recevait une erreur 500 avec le message :
```
RuntimeError: You called this URL via POST, but the URL doesn't end in a slash and you have APPEND_SLASH set.
```

## ✅ Corrections apportées

### 1. Backend d'authentification par email

**Fichier créé** : `backend-django/tenants/backends.py`

Django par défaut utilise `username` pour l'authentification, mais notre système utilise `email`. J'ai créé un backend d'authentification personnalisé qui permet l'authentification par email.

**Fichier modifié** : `backend-django/vtcbuilder/settings.py`

Ajout du backend d'authentification personnalisé en première position dans `AUTHENTICATION_BACKENDS`.

### 2. URLs corrigées dans le frontend

**Fichier modifié** : `frontend/src/services/auth.service.ts`

Toutes les URLs d'authentification ont été corrigées pour inclure le slash final :
- `/auth/login/` au lieu de `/auth/login`
- `/auth/register/` au lieu de `/auth/register`
- `/auth/logout/` au lieu de `/auth/logout`
- `/auth/me/` au lieu de `/auth/me`

### 3. Format de réponse corrigé

**Fichier modifié** : `frontend/src/services/auth.service.ts`

Le backend Django renvoie `tokens.access` et `tokens.refresh`, mais le frontend cherchait `token`. Correction effectuée pour utiliser la structure correcte :
```typescript
if (response.data.tokens?.access) {
  localStorage.setItem('token', response.data.tokens.access);
  localStorage.setItem('refresh_token', response.data.tokens.refresh);
}
```

### 4. Serializer amélioré

**Fichier modifié** : `backend-django/tenants/serializers.py`

Le serializer `UserSerializer` a été amélioré pour inclure :
- `roles` : Tableau des rôles de l'utilisateur
- `permissions` : Permissions de l'utilisateur
- `name` : Nom complet de l'utilisateur
- `tenant_id` : ID du tenant

### 5. Gestion d'erreur améliorée

**Fichier modifié** : `frontend/src/app/login/page.tsx`

Amélioration de la gestion des erreurs pour afficher les messages d'erreur du backend de manière plus claire.

## 🚀 Test de la connexion

Pour tester après redémarrage :

1. **Redémarrer le backend** :
   ```bash
   docker restart vtcbuilder_backend
   ```

2. **Vérifier que le super admin existe** :
   ```bash
   docker exec vtcbuilder_backend python manage.py shell -c "from tenants.models import User; print(User.objects.filter(role='super-admin').count())"
   ```

3. **Si le super admin n'existe pas, le créer** :
   ```bash
   cd backend-django
   make setup-permissions
   ```

4. **Tester la connexion** :
   - Ouvrir http://localhost:9494/login
   - Utiliser les identifiants :
     - Email : `admin@vtcbuilder.com`
     - Mot de passe : `admin123`

## 📝 Structure de réponse de l'API

L'API `/api/auth/login/` renvoie maintenant :

```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@vtcbuilder.com",
    "name": "Super Admin",
    "roles": ["super-admin"],
    "permissions": [],
    "tenant_id": null,
    ...
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

## ⚠️ Notes importantes

- Le backend doit être redémarré pour que le nouveau backend d'authentification soit pris en compte
- Les rôles sont maintenant retournés comme un tableau dans le serializer
- Le token d'accès est stocké dans `localStorage` avec la clé `token`
- Le refresh token est stocké dans `localStorage` avec la clé `refresh_token`

## 🔍 Dépannage

Si le login ne fonctionne toujours pas :

1. Vérifier les logs du backend :
   ```bash
   docker logs vtcbuilder_backend --tail 50
   ```

2. Vérifier que le super admin existe :
   ```bash
   docker exec vtcbuilder_backend python manage.py shell -c "from tenants.models import User; u = User.objects.filter(role='super-admin').first(); print(u.email if u else 'No super admin')"
   ```

3. Vérifier les erreurs dans la console du navigateur (F12)

4. Vérifier que les services sont bien démarrés :
   ```bash
   make status
   ```

