# 🔧 Configuration des Variables d'Environnement

> **Guide complet pour configurer les variables d'environnement en développement et en production**

---

## 📋 Vue d'Ensemble

VTCBuilder utilise des variables d'environnement pour configurer :
- Les URLs du frontend (pour les emails de reset password, invitations, etc.)
- Les paramètres de base de données
- La configuration SMTP pour l'envoi d'emails
- Les clés de sécurité

---

## 🚀 Configuration Développement

### Backend Django

1. **Copier le fichier d'exemple** :
   ```bash
   cd backend-django
   cp .env.example .env
   ```

2. **Modifier les valeurs dans `.env`** :
   ```env
   # URL du frontend (utilisée dans les emails)
   FRONTEND_URL=http://localhost:9494
   
   # Configuration SMTP (OVH par exemple)
   EMAIL_HOST=ssl0.ovh.net
   EMAIL_PORT=587
   EMAIL_HOST_USER=test@delhomme.ovh
   EMAIL_HOST_PASSWORD=votre-mot-de-passe
   ```

3. **Ou utiliser Docker Compose** :
   Les variables sont déjà configurées dans `docker-compose.simple.yml` :
   ```yaml
   environment:
     FRONTEND_URL: http://localhost:9494
     EMAIL_HOST: ssl0.ovh.net
     # ...
   ```

### Frontend Next.js

1. **Créer le fichier `.env.local`** :
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Modifier les valeurs** :
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:9495
   ```

---

## 🌐 Configuration Production

### Backend Django

1. **Créer le fichier `.env` dans `backend-django/`** :
   ```env
   # ============================================
   # PRODUCTION - VTCBuilder Backend
   # ============================================
   
   # Base de données
   DB_ENGINE=django_tenants.postgresql_backend
   DB_NAME=vtcbuilder_prod
   DB_USER=vtcbuilder_user
   DB_PASSWORD=CHANGEZ-MOI-EN-PRODUCTION
   DB_HOST=postgres
   DB_PORT=5432
   
   # Redis
   REDIS_URL=redis://redis:6379/0
   
   # Sécurité
   SECRET_KEY=CHANGEZ-MOI-EN-PRODUCTION-MINIMUM-50-CARACTERES
   DEBUG=0
   ALLOWED_HOSTS=vtcbuilder.com,www.vtcbuilder.com,api.vtcbuilder.com
   
   # ============================================
   # URL FRONTEND (IMPORTANT POUR LES EMAILS)
   # ============================================
   # Cette URL est utilisée dans :
   # - Les emails de reset password
   # - Les emails d'invitation tenant
   # - Les liens de vérification
   FRONTEND_URL=https://vtcbuilder.com
   
   # ============================================
   # CONFIGURATION EMAIL SMTP PRODUCTION
   # ============================================
   EMAIL_HOST=smtp.votre-domaine.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_USE_SSL=False
   EMAIL_HOST_USER=noreply@vtcbuilder.com
   EMAIL_HOST_PASSWORD=votre-mot-de-passe-email-production
   DEFAULT_FROM_EMAIL=noreply@vtcbuilder.com
   ```

2. **Ou utiliser Docker Compose avec variables d'environnement** :
   ```yaml
   services:
     backend:
       environment:
         FRONTEND_URL: ${FRONTEND_URL:-https://vtcbuilder.com}
         EMAIL_HOST: ${EMAIL_HOST}
         # ...
   ```

### Frontend Next.js

1. **Créer le fichier `.env.production`** :
   ```env
   NEXT_PUBLIC_API_URL=https://api.vtcbuilder.com
   NODE_ENV=production
   ```

2. **Ou utiliser les variables d'environnement du système** :
   ```bash
   export NEXT_PUBLIC_API_URL=https://api.vtcbuilder.com
   ```

---

## 📧 Configuration Email SMTP

### Variables Requises

```env
EMAIL_HOST=smtp.votre-domaine.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=votre-email@votre-domaine.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe
DEFAULT_FROM_EMAIL=noreply@vtcbuilder.com
```

### Test de Configuration Email

```bash
# Dans le conteneur backend
docker-compose exec backend python test_email_smtp.py
```

---

## 🔗 URLs Utilisées dans les Emails

### Reset Password

L'URL générée est : `{FRONTEND_URL}/reset-password?token={token}&email={email}`

**Exemple développement** :
```
http://localhost:9494/reset-password?token=abc123&email=user@example.com
```

**Exemple production** :
```
https://vtcbuilder.com/reset-password?token=abc123&email=user@example.com
```

### Invitation Tenant

L'URL générée est : `{FRONTEND_URL}/setup?token={token}&email={email}`

**Exemple développement** :
```
http://localhost:9494/setup?token=abc123&email=admin@tenant.com
```

**Exemple production** :
```
https://vtcbuilder.com/setup?token=abc123&email=admin@tenant.com
```

---

## ✅ Vérification de la Configuration

### Backend

1. **Vérifier que les variables sont chargées** :
   ```bash
   docker-compose exec backend python manage.py shell
   ```
   ```python
   from django.conf import settings
   print(f"FRONTEND_URL: {settings.FRONTEND_URL}")
   print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
   ```

2. **Tester l'envoi d'email** :
   ```bash
   docker-compose exec backend python test_email_smtp.py
   ```

### Frontend

1. **Vérifier la variable d'environnement** :
   ```bash
   # Dans le conteneur frontend
   docker-compose exec frontend printenv NEXT_PUBLIC_API_URL
   ```

---

## 🔒 Sécurité en Production

### ⚠️ IMPORTANT

1. **Ne jamais commiter les fichiers `.env`** :
   - `.env` est dans `.gitignore`
   - Utiliser `.env.example` comme template

2. **Changer toutes les valeurs par défaut** :
   - `SECRET_KEY` : Générer une clé aléatoire de minimum 50 caractères
   - `DB_PASSWORD` : Mot de passe fort
   - `EMAIL_HOST_PASSWORD` : Mot de passe email sécurisé

3. **Désactiver DEBUG en production** :
   ```env
   DEBUG=0
   ```

4. **Configurer ALLOWED_HOSTS** :
   ```env
   ALLOWED_HOSTS=vtcbuilder.com,www.vtcbuilder.com,api.vtcbuilder.com
   ```

---

## 🐛 Dépannage

### Le token de reset password ne fonctionne pas

1. **Vérifier que `FRONTEND_URL` est correct** :
   ```bash
   docker-compose exec backend python manage.py shell
   ```
   ```python
   from django.conf import settings
   print(settings.FRONTEND_URL)
   ```

2. **Vérifier que le token existe dans la base de données** :
   ```bash
   docker-compose exec backend python manage.py shell
   ```
   ```python
   from tenants.models import PasswordResetToken
   token = PasswordResetToken.objects.filter(token='votre-token').first()
   if token:
       print(f"Token valide: {token.is_valid()}")
       print(f"User: {token.user.email}")
       print(f"Expires: {token.expires_at}")
   ```

3. **Créer un token de test valide** :
   ```bash
   docker-compose exec backend python manage.py shell
   ```
   ```python
   from tenants.models import User, PasswordResetToken
   from django.utils import timezone
   from datetime import timedelta
   from django.utils.crypto import get_random_string
   
   user = User.objects.get(email='test@delhomme.ovh')
   token = get_random_string(length=64)
   expires_at = timezone.now() + timedelta(hours=24)
   
   reset_token = PasswordResetToken.objects.create(
       user=user,
       token=token,
       expires_at=expires_at,
       used=False
   )
   
   from django.conf import settings
   frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:9494')
   print(f"URL de test: {frontend_url}/reset-password?token={token}&email={user.email}")
   ```

### Les emails ne partent pas

1. **Vérifier la configuration SMTP** :
   ```bash
   docker-compose exec backend python test_email_smtp.py
   ```

2. **Vérifier les logs** :
   ```bash
   docker-compose logs backend | grep -i email
   ```

---

## 📚 Références

- [Django Settings Documentation](https://docs.djangoproject.com/en/stable/topics/settings/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [python-decouple Documentation](https://github.com/henriquebastos/python-decouple)

