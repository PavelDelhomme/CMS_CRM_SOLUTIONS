# 🔐 Connexion au Tenant Demo - Guide

## 📋 Informations de Connexion

### Tenant Demo VTC Company

- **Nom du Tenant** : Demo VTC Company
- **Email du Tenant** : `demo@vtccompany.com`
- **Slug** : `demo-vtc-company`

### Compte Admin du Tenant

- **Email** : `admin@demo-vtc-company.com`
- **Mot de passe** : `admin123`
- **Rôle** : `tenant-admin`

## 🚀 Comment Se Connecter

### Option 1 : Via l'interface de login

1. Aller sur `http://localhost:9494/login`
2. Entrer l'email : `admin@demo-vtc-company.com`
3. Entrer le mot de passe : `admin123`
4. Cliquer sur "Se connecter"
5. Vous serez redirigé vers `/dashboard` (interface tenant)

### Option 2 : Créer un nouveau tenant avec invitation

1. Se connecter en super-admin : `admin@vtcbuilder.com` / `admin123`
2. Aller sur `/admin/tenants/new`
3. Créer un nouveau tenant avec l'email du client
4. Un email d'invitation est envoyé automatiquement
5. Le client clique sur le lien et définit son mot de passe

## 🎯 Interface Tenant vs Super Admin

### Interface Tenant (`/dashboard/*`)
- Gestion du site du tenant
- Pages, Services, Réservations
- Gestion des utilisateurs du tenant
- Paramètres du tenant

### Interface Super Admin (`/admin/*`)
- Gestion de tous les tenants
- Gestion de tous les utilisateurs
- Statistiques globales
- Facturation
- Paramètres de la plateforme

## 📝 Notes Importantes

1. **Email du tenant** (`demo@vtccompany.com`) ≠ **Email admin** (`admin@demo-vtc-company.com`)
   - L'email du tenant est l'email de contact du client
   - L'email admin est l'email de connexion pour gérer le site

2. **Mot de passe par défaut** : Toujours `admin123` pour les nouveaux tenants
   - À changer immédiatement après la première connexion
   - Ou utiliser le système d'invitation pour définir un mot de passe dès le début

3. **Système d'invitation** :
   - Lors de la création d'un tenant, un email d'invitation est envoyé
   - Le lien permet de définir le mot de passe
   - Valide pendant 7 jours

---

**💡 Astuce** : Pour tester rapidement, utilisez `admin@demo-vtc-company.com` / `admin123` pour vous connecter au tenant demo.

