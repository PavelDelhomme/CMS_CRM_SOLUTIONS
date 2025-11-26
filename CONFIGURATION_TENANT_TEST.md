# ✅ Configuration Tenant de Test - "Ma Société VTC"

## 🎯 Tenant de Test Principal

**Nom** : Ma Société VTC  
**Slug** : `ma-societe-vtc`  
**Domaine** : `ma-societe-vtc.localhost`  
**Email Admin** : `admin@masociete-vtc.com`  
**Mot de passe** : `admin123`  
**Statut** : Active  
**Rôle** : Tenant Admin

## 📝 Comptes de Test Disponibles

### Super Admin (Gestion globale)
- **Email** : `admin@vtcbuilder.com`
- **Mot de passe** : `admin123`
- **Accès** : http://localhost:9494/admin/dashboard
- **Fonctionnalités** :
  - Gestion de tous les tenants
  - Gestion de tous les utilisateurs
  - Vue d'ensemble de la plateforme
  - Facturation globale

### Tenant Admin (Gestion du site VTC)
- **Email** : `admin@masociete-vtc.com`
- **Mot de passe** : `admin123`
- **Accès** : http://localhost:9494/dashboard
- **Fonctionnalités** :
  - Gestion du contenu (pages)
  - Gestion des services VTC
  - Gestion des réservations
  - Gestion des médias
  - Gestion des templates
  - Gestion des utilisateurs du tenant
  - Facturation du tenant
  - Paramètres du tenant

## 🔧 Commande de Configuration

Pour recréer ou corriger le tenant de test :

```bash
docker exec vtcbuilder_backend python manage.py fix_test_tenant --password admin123
```

Cette commande :
- ✅ Crée ou met à jour le tenant "Ma Société VTC"
- ✅ Crée ou met à jour l'utilisateur admin
- ✅ Configure le domaine
- ✅ Assigne les permissions
- ✅ Définit le statut à "active"

## 🚀 Utilisation

### Se Connecter au Tenant

1. **Aller sur** : http://localhost:9494/login
2. **Entrer les identifiants** :
   - Email : `admin@masociete-vtc.com`
   - Mot de passe : `admin123`
3. **Vous serez redirigé vers** : `/dashboard`
4. **Interface WordPress-like** pour gérer son site VTC

### Interface Tenant Admin

L'interface `/dashboard` permet de :
- 📄 **Pages** : Créer et gérer les pages du site
- 🚗 **Services VTC** : Définir les prestations (tarifs, zones, etc.)
- 📅 **Réservations** : Voir et gérer les réservations
- 🖼️ **Médias** : Gérer les images et fichiers
- 🎨 **Templates** : Personnaliser le design du site
- 👥 **Utilisateurs** : Gérer les utilisateurs du tenant (drivers, operators)
- 💳 **Facturation** : Voir l'abonnement et les factures
- ⚙️ **Paramètres** : Configurer le tenant

## 🔐 Sécurité

- ✅ Le tenant est actif et fonctionnel
- ✅ L'utilisateur admin a les bonnes permissions
- ✅ Le mot de passe est défini et fonctionnel
- ✅ Le domaine est configuré

## 📌 Page de Login

La page de login affiche maintenant :
- **Super Admin** : admin@vtcbuilder.com / admin123
- **Tenant Test** : admin@masociete-vtc.com / admin123

---

**Date** : 2025-11-26  
**Status** : ✅ Configuré et fonctionnel

