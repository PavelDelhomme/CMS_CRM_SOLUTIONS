# 👤 Création Automatique d'Utilisateur Admin pour les Tenants

## ✅ Système Implémenté

### 1. Création Automatique lors de la Création d'un Tenant

Lorsqu'un nouveau tenant est créé via l'API (dans `TenantSerializer.create()`) :

1. **Email utilisé** : L'email fourni dans le formulaire de création (`tenant.email`)
2. **Création de l'utilisateur admin** :
   - Username généré automatiquement à partir de l'email
   - Email utilisé comme identifiant de connexion
   - Rôle : `tenant-admin`
   - Status : `pending` (en attente de configuration)
   - Mot de passe : aléatoire (sera changé via invitation)

3. **Invitation envoyée** :
   - Token d'invitation créé (valable 30 jours)
   - Email envoyé avec lien de configuration
   - Lien pointe vers `/setup?token=...&email=...`

### 2. Commandes de Gestion

#### Créer un admin pour un tenant existant

```bash
# Pour un tenant spécifique
docker exec vtcbuilder_backend python manage.py create_tenant_admin --tenant-id 1

# Pour tous les tenants sans admin
docker exec vtcbuilder_backend python manage.py create_tenant_admin --all
```

Cette commande :
- Vérifie si le tenant a déjà un admin
- Crée un utilisateur admin si nécessaire
- Génère un email par défaut si aucun email n'est fourni
- Envoie une invitation par email
- Affiche l'URL de configuration

### 3. Email Généré Automatiquement

Si aucun email n'est fourni lors de la création du tenant :
- Format : `admin@{tenant-slug}.vtcbuilder.local`
- Exemple : Pour tenant "Demo VTC Company" → `admin@demo-vtc-company.vtcbuilder.local`

## 🔧 Utilisation

### Créer un nouveau tenant avec admin automatique

1. **Via l'interface admin** (`/admin/tenants/new`) :
   - Remplir le formulaire avec le nom et l'email du tenant
   - Un utilisateur admin est automatiquement créé
   - Une invitation est envoyée par email

2. **Via l'API** :
   ```python
   POST /api/tenants/
   {
     "name": "Mon Tenant",
     "email": "admin@montenant.com"
   }
   ```

### Activer un utilisateur existant

Si un utilisateur existe mais n'est pas actif :

```python
from tenants.models import User
user = User.objects.get(email='admin@demo-vtc-company.com')
user.status = 'active'
user.is_active = True
user.set_password('admin123')  # Définir un mot de passe
user.save()
```

## 📋 Informations de Connexion

### Pour le tenant "Demo VTC Company"

- **Email** : `admin@demo-vtc-company.com`
- **Mot de passe** : Défini via `/setup` (page d'invitation) ou réinitialisé manuellement

### Accès

1. **Via invitation** :
   - Cliquer sur le lien dans l'email
   - Définir le mot de passe sur `/setup`
   - Se connecter avec l'email et le nouveau mot de passe

2. **Connexion directe** :
   - Aller sur `/login`
   - Utiliser l'email et le mot de passe
   - Redirigé vers `/dashboard` (interface tenant)

## 🎯 Fonctionnalités

- ✅ Création automatique d'un utilisateur admin lors de la création d'un tenant
- ✅ Génération automatique d'email si non fourni
- ✅ Invitation par email avec lien de configuration
- ✅ Commandes de gestion pour créer des admins manuellement
- ✅ Vérification de l'existence d'un admin avant création
- ✅ Gestion des permissions automatique

---

**✅ Le système garantit qu'un utilisateur admin est toujours créé lors de la création d'un tenant !**

