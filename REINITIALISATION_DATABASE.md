# 🔄 Réinitialisation de la Base de Données

## ✅ Base de données réinitialisée avec succès !

### 📋 Comptes créés

#### 1. SUPER ADMIN 👤
- **Email** : `admin@vtcbuilder.com`
- **Mot de passe** : `admin123`
- **Rôle** : Super Administrator
- **Interface** : `http://localhost:9494/admin/dashboard`
- **Accès** : Gestion complète de la plateforme

#### 2. TENANT ADMIN 🏢
- **Tenant** : Ma Société VTC
- **Email** : `admin@masociete-vtc.com`
- **Mot de passe** : `admin123`
- **Rôle** : Tenant Administrator
- **Interface** : `http://localhost:9494/dashboard`
- **Accès** : Gestion de son site web (interface WordPress-like)

### 💳 Plans tarifaires créés

1. **Starter** - 29.99€/mois
   - 1 site, 2 utilisateurs, 5 Go

2. **Business** - 79.99€/mois (Populaire)
   - 3 sites, 10 utilisateurs, 50 Go

3. **Enterprise** - 199.99€/mois
   - 10 sites, 50 utilisateurs, 500 Go

## 🔧 Commande de réinitialisation

Pour réinitialiser la base de données :

```bash
docker exec vtcbuilder_backend python manage.py reset_database --confirm
```

**⚠️ ATTENTION** : Cette commande supprime **TOUTES** les données et ne garde que :
- 1 super admin
- 1 tenant avec son admin
- Les plans tarifaires de base

## 📝 Ce qui est supprimé

- ✅ Tous les utilisateurs (sauf ceux recréés)
- ✅ Tous les tenants et leurs schémas PostgreSQL
- ✅ Tous les tokens (reset password, invitations)
- ✅ Toutes les données de facturation (subscriptions, invoices, payments)
- ✅ Tous les domains

## ✨ Ce qui est créé

1. **Super Admin** avec permissions complètes
2. **Un tenant de démo** "Ma Société VTC" avec :
   - Son propre schéma PostgreSQL
   - Un utilisateur admin
   - Un domaine `ma-societe-vtc.localhost`
3. **3 plans tarifaires** (Starter, Business, Enterprise)

---

**✅ La base de données est maintenant propre et prête pour le développement !**

