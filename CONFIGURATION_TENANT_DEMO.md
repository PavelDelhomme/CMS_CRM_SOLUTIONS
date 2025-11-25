# ✅ Configuration Complète du Tenant Demo

## 🏢 Tenant: Demo VTC Company

### Informations du Tenant

- **Nom** : Demo VTC Company
- **Email du tenant** : `demo@vtccompany.com`
- **Slug** : `demo-vtc-company`
- **Schema** : `demo_vtc_company`
- **Plan** : `business`
- **Status** : `active`

## 👤 Utilisateur Administrateur

### Informations de Connexion

- **Email** : `admin@demo-vtc-company.com`
- **Nom** : Tenant Admin
- **Mot de passe** : `admin123`
- **Rôle** : `tenant-admin`
- **Status** : `active`

### Permissions

L'utilisateur admin a les permissions complètes pour :
- Gérer le contenu du tenant (pages, services, réservations)
- Gérer les utilisateurs du tenant
- Accéder aux paramètres du tenant
- Gérer les médias et templates

## 🔗 Connexion

### URL de Connexion

```
http://localhost:9494/login
```

### Identifiants

- **Email** : `admin@demo-vtc-company.com`
- **Mot de passe** : `admin123`

## 📍 Accès aux Interfaces

### Interface Tenant (après connexion)

- **Dashboard** : `http://localhost:9494/dashboard`
- **Pages** : `http://localhost:9494/dashboard/pages`
- **Services** : `http://localhost:9494/dashboard/services`
- **Réservations** : `http://localhost:9494/dashboard/bookings`
- **Utilisateurs** : `http://localhost:9494/dashboard/users`
- **Paramètres** : `http://localhost:9494/dashboard/settings`

### Interface Super Admin

- **URL** : `http://localhost:9494/login`
- **Email** : `admin@vtcbuilder.com`
- **Mot de passe** : `admin123`

## ✅ Configuration Effectuée

1. ✅ Tenant créé avec email `demo@vtccompany.com`
2. ✅ Schema PostgreSQL généré : `demo_vtc_company`
3. ✅ Utilisateur admin créé avec email `admin@demo-vtc-company.com`
4. ✅ Mot de passe configuré : `admin123`
5. ✅ Permissions assignées (tenant-admin)
6. ✅ Status actif pour le tenant et l'utilisateur

## 🚀 Test de Connexion

Pour tester la connexion au tenant demo :

1. Aller sur `http://localhost:9494/login`
2. Entrer :
   - Email : `admin@demo-vtc-company.com`
   - Mot de passe : `admin123`
3. Cliquer sur "Se connecter"
4. Vous serez redirigé vers `/dashboard` (interface WordPress-style du tenant)

## 📝 Notes Importantes

### Différence entre Email Tenant et Email Admin

- **Email tenant** (`demo@vtccompany.com`) : Email de contact du client/entreprise
- **Email admin** (`admin@demo-vtc-company.com`) : Email de connexion pour gérer le site

### Sécurité

⚠️ **Important** : Le mot de passe par défaut `admin123` doit être changé après la première connexion, surtout en production !

### Système d'Invitation

Pour les nouveaux tenants créés depuis l'interface admin, un email d'invitation est automatiquement envoyé à l'email du tenant pour définir le mot de passe initial.

---

**✅ Le tenant Demo VTC Company est maintenant complètement configuré et prêt à l'emploi !**

