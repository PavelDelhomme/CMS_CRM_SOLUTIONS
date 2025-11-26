# ✅ Tenant de Test - Configuration Finale

## 🎯 Tenant de Test Principal

**Nom** : Ma Société VTC  
**Slug** : `ma-societe-vtc`  
**Domaine** : `ma-societe-vtc.localhost`  
**Email Admin** : `test@delhomme.ovh`  
**Mot de passe** : `admin123`  
**Statut** : Active  
**Rôle** : Tenant Admin

## 📝 Compte de Test Tenant

### Tenant Admin (Gestion du site VTC)
- **Email** : `test@delhomme.ovh`
- **Mot de passe** : `admin123`
- **Accès** : http://localhost:9494/dashboard
- **Interface WordPress-like** pour gérer son site VTC

### Fonctionnalités Disponibles

L'interface `/dashboard` permet de :
- 📄 **Pages** : Créer et gérer les pages du site
- 🚗 **Services VTC** : Définir les prestations (tarifs, zones, etc.)
- 📅 **Réservations** : Voir et gérer les réservations
- 🖼️ **Médias** : Gérer les images et fichiers
- 🎨 **Templates** : Personnaliser le design du site
- 👥 **Utilisateurs** : Gérer les utilisateurs du tenant (drivers, operators)
- 💳 **Facturation** : Voir l'abonnement et les factures
- ⚙️ **Paramètres** : Configurer le tenant

## 🔧 Commandes de Configuration

### Mettre à jour l'email admin
```bash
docker exec vtcbuilder_backend python manage.py update_test_tenant_email --password admin123
```

### Recréer le tenant de test
```bash
docker exec vtcbuilder_backend python manage.py fix_test_tenant --password admin123
```

## 🚀 Connexion

1. **Aller sur** : http://localhost:9494/login
2. **Entrer les identifiants** :
   - Email : `test@delhomme.ovh`
   - Mot de passe : `admin123`
3. **Vous serez redirigé vers** : `/dashboard`
4. **Interface WordPress-like** pour gérer son site VTC

## ✅ Vérification

Le tenant est configuré et fonctionnel :
- ✅ Tenant actif
- ✅ Utilisateur admin créé avec `test@delhomme.ovh`
- ✅ Mot de passe fonctionnel (`admin123`)
- ✅ Authentification testée et validée
- ✅ Permissions assignées
- ✅ Abonnement Business (3 utilisateurs, 20 Go)

---

**Date** : 2025-11-26  
**Status** : ✅ Configuré et fonctionnel avec `test@delhomme.ovh`

