# ✅ Correction Tenant Demo et Configuration

## Problèmes Résolus

### 1. Tenant Demo non fonctionnel
**Problème** : Le tenant "Demo VTC Company" n'existait pas ou était mal configuré, empêchant la connexion de l'utilisateur admin.

**Solution** : Commande de gestion `fix_demo_tenant` créée pour :
- Créer le tenant "Demo VTC Company" avec le slug `demo-vtc-company`
- Créer l'utilisateur admin `admin@demo-vtc-company.com` avec le rôle `tenant-admin`
- Configurer le domaine `demo-vtc-company.localhost`
- Définir un mot de passe ou créer un token d'invitation

### 2. Email incorrect dans le tenant
**Problème** : L'email `demo@vtccompany.com` apparaissait au lieu de `admin@demo-vtc-company.com`.

**Solution** : 
- Le serializer `TenantSerializer` utilise maintenant correctement `tenant.email` pour créer l'admin utilisateur
- L'email fourni lors de la création du tenant est utilisé pour l'utilisateur admin

### 3. Warning de Pagination
**Problème** : `UnorderedObjectListWarning` apparaissait dans les logs.

**Solution** :
- Ajout de `ordering = ['-created_at']` dans la classe Meta du modèle User
- Ajout d'`.order_by('-created_at')` dans le queryset de base du UserViewSet
- Ajout d'`.order_by('-created_at')` dans `get_queryset()` du UserViewSet

## Utilisation

### Créer/Corriger le Tenant Demo

```bash
# Créer le tenant avec un mot de passe défini
docker exec vtcbuilder_backend python manage.py fix_demo_tenant --password admin123

# Créer le tenant avec un token d'invitation (utilisateur devra configurer son mot de passe)
docker exec vtcbuilder_backend python manage.py fix_demo_tenant
```

### Se Connecter au Tenant Demo

**URL** : http://localhost:9494/login

**Identifiants** (si mot de passe défini) :
- Email : `admin@demo-vtc-company.com`
- Mot de passe : `admin123` (ou celui défini avec `--password`)

**Avec invitation** :
- Utiliser le lien d'invitation fourni dans l'email ou généré par la commande

## Création de Nouveau Tenant

Lors de la création d'un nouveau tenant via l'interface admin :

1. **Remplir le formulaire** :
   - Nom du tenant (ex: "Ma Société VTC")
   - Email de l'admin (ex: `admin@masociete-vtc.com`)
   - Le slug est généré automatiquement

2. **Un utilisateur admin est créé automatiquement** :
   - Email : celui fourni dans le champ "Email"
   - Rôle : `tenant-admin`
   - Statut : `pending` (en attente de configuration)
   - Un email d'invitation est envoyé pour configurer le mot de passe

3. **L'utilisateur peut** :
   - Recevoir l'email d'invitation
   - Cliquer sur le lien pour configurer son mot de passe
   - Se connecter avec son email et le mot de passe choisi

## Workflow Complet

### Super Admin
1. Crée un tenant via `/admin/tenants/new`
2. Un utilisateur admin est automatiquement créé avec l'email fourni
3. Un email d'invitation est envoyé à cet utilisateur

### Tenant Admin
1. Reçoit l'email d'invitation
2. Clique sur le lien pour configurer son mot de passe
3. Se connecte avec son email et mot de passe
4. Accède à l'interface d'administration du tenant (`/dashboard`)

## Vérification

Pour vérifier que tout fonctionne :

```bash
# Vérifier le tenant
docker exec vtcbuilder_backend python manage.py shell -c "
from tenants.models import Tenant, User
tenant = Tenant.objects.get(slug='demo-vtc-company')
print('Tenant:', tenant.name, tenant.email)
user = User.objects.filter(tenant=tenant, role='tenant-admin').first()
print('User:', user.email, user.role, user.status)
"
```

---

**Date** : 2025-11-26
**Status** : ✅ Corrigé et fonctionnel

