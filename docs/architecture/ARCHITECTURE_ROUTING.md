# 🏗️ Architecture du Routing et des URLs

## 📋 Vue d'ensemble

Le système CMS CRM Solutions est une plateforme **multi-tenant** avec 3 types d'interfaces distinctes :

### 1. 🎯 Interface Super Admin
**URL de base**: `localhost:9494/admin/`
- **Login**: `localhost:9494/admin/login` (ou `/login` avec redirection)
- **Dashboard**: `localhost:9494/admin/dashboard`
- **Tenants**: `localhost:9494/admin/tenants`
- **Users**: `localhost:9494/admin/users`
- **Stats**: `localhost:9494/admin/stats`
- **Billing**: `localhost:9494/admin/billing`
- **Settings**: `localhost:9494/admin/settings`

**Objectif**: Gérer tous les tenants, utilisateurs, et la plateforme globale.

---

### 2. 🏢 Interface Tenant Admin (WordPress-style)
**URL de base**: `[tenant-slug].localhost:9494/`
- **Login**: `[tenant-slug].localhost:9494/admin/login` ou `[tenant-slug].localhost:9494/login`
- **Dashboard**: `[tenant-slug].localhost:9494/dashboard`
- **Users**: `[tenant-slug].localhost:9494/dashboard/users`
- **Billing**: `[tenant-slug].localhost:9494/dashboard/billing`
- **Pages**: `[tenant-slug].localhost:9494/dashboard/pages`
- **Services**: `[tenant-slug].localhost:9494/dashboard/services`

**Objectif**: Gérer le site et les données du tenant (comme WordPress).

**Exemple pour "Mon Entreprise"**:
- Login: `mon-entreprise.localhost:9194/admin/login`
- Dashboard: `mon-entreprise.localhost:9194/dashboard`

---

### 3. 🌐 Site Public du Tenant
**URL de base**: `[tenant-slug].localhost:9494/`
- **Page d'accueil**: `[tenant-slug].localhost:9494/`
- **Pages publiques**: `[tenant-slug].localhost:9494/pages/[slug]`
- **Réservation**: `[tenant-slug].localhost:9494/book`
- **Contact**: `[tenant-slug].localhost:9494/contact`

**Objectif**: Site public visible par les clients finaux.

---

### 4. 🚀 Landing Page Publique
**URL**: `localhost:9494/`
- **Accueil**: `localhost:9494/`
- **Créer un compte**: `localhost:9494/register`
- **Pricing**: `localhost:9494/pricing`
- **Contact**: `localhost:9494/contact`

**Objectif**: Page marketing pour acquérir de nouveaux tenants.

---

## 🔄 Logique de Routing

### Backend (Django)
Le backend utilise `django-tenants` avec le middleware `TenantMainMiddleware` qui :
1. Détecte le domaine/sous-domaine de la requête
2. Route automatiquement vers le schéma tenant correspondant
3. Les requêtes à `localhost:9495` ou `api.localhost:9495` → schéma `public` (super admin)
4. Les requêtes à `[tenant-slug].localhost:9495` → schéma `t_[tenant-slug]` (tenant)

### Frontend (Next.js)
Le frontend doit :
1. Détecter le sous-domaine dans l'URL
2. Router vers la bonne interface selon le contexte
3. Rediriger les non-authentifiés vers la page login appropriée

---

## 🛠️ Configuration Actuelle

### Middleware django-tenants
**Fichier**: `backend-django/config/core/settings.py`
```python
MIDDLEWARE = [
    'django_tenants.middleware.main.TenantMainMiddleware',  # À ACTIVER
    # ...
]
```

**Status**: ⚠️ Actuellement désactivé (commenté ligne 51)

### Domains
Chaque tenant a un domaine dans la table `domains`:
- `mon-entreprise.localhost` → Tenant "Mon Entreprise"
- `localhost` → Public schema (super admin)

---

## ✅ À Faire

### 1. Activer le middleware django-tenants
- Décommenter le middleware dans `settings.py`
- Tester le routing multi-tenant

### 2. Créer les pages tenant
- `[tenant-slug].localhost:9494/admin/login` → Login tenant admin
- `[tenant-slug].localhost:9494/dashboard/*` → Dashboard tenant
- `[tenant-slug].localhost:9494/*` → Site public tenant

### 3. Créer la landing page
- `localhost:9494/` → Landing page publique
- `localhost:9494/register` → Formulaire de création de tenant

### 4. Gérer les redirections
- Super admin non connecté → `/admin/login`
- Tenant admin non connecté → `/[tenant-slug]/admin/login`
- Tenant public → `/` du tenant

---

## 📝 Exemples Concrets

### Super Admin
```
http://localhost:9494/admin/login
→ Connexion avec admin@cms-crm-solutions.com
→ Redirection vers /admin/dashboard
```

### Tenant Admin
```
http://mon-entreprise.localhost:9194/admin/login
→ Connexion avec test@delhomme.ovh
→ Redirection vers /dashboard
```

### Site Public Tenant
```
http://mon-entreprise.localhost:9194/
→ Affichage du site public du tenant
→ Réservation, contact, etc.
```

### Landing Page
```
http://localhost:9494/
→ Page d'accueil CMS CRM Solutions
→ Bouton "Créer mon compte" → /register
```

---

## 🔍 Détection du Context

### Dans le frontend Next.js
```typescript
// Détecter si on est sur un sous-domaine tenant
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isTenantDomain = hostname.includes('.localhost') && hostname !== 'localhost';
const tenantSlug = isTenantDomain ? hostname.split('.')[0] : null;
```

### Dans le backend Django
```python
# Le middleware django-tenants set automatiquement request.tenant
if hasattr(request, 'tenant'):
    # On est sur un domaine tenant
    tenant = request.tenant
else:
    # On est sur le domaine public (super admin)
```

---

## 🎯 Prochaines Étapes

1. ⏳ Activer le middleware django-tenants
2. ⏳ Créer la logique de détection du contexte dans le frontend
3. ⏳ Créer les pages tenant admin
4. ⏳ Créer les pages publiques tenant
5. ⏳ Créer la landing page publique
6. ⏳ Tester tous les scénarios de routing

