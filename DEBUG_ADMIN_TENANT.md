# 🔐 Debug Admin Tenant - Documentation

## 📋 Fonctionnalité

Dans l'interface super admin, vous pouvez maintenant **voir et réinitialiser le mot de passe de l'admin d'un tenant** pour faciliter les tests et le debug.

## 🎯 Accès

1. Connectez-vous en tant que **super admin** (`admin@vtcbuilder.com` / `admin123`)
2. Allez dans **Admin > Tenants**
3. Cliquez sur un tenant pour voir ses détails
4. Dans l'onglet **"Vue d'ensemble"**, vous verrez une section **"🔐 Informations Admin (Debug)"**

## ✨ Fonctionnalités

### Affichage des Informations Admin

La section affiche :
- ✅ **Email Admin** : L'email de l'utilisateur admin du tenant
- ✅ **Username** : Le nom d'utilisateur
- ✅ **Statut** : Le statut actuel (active, pending, etc.)

### Réinitialisation du Mot de Passe

Vous pouvez :
- ✅ Définir un mot de passe personnalisé (par défaut: `admin123`)
- ✅ Réinitialiser le mot de passe avec un simple clic
- ✅ Voir le mot de passe après réinitialisation
- ✅ Copier les identifiants pour se connecter

## 🔧 API Endpoints

### GET `/api/tenants/{id}/get_admin_info/`

Récupère les informations de l'admin du tenant.

**Réponse :**
```json
{
  "exists": true,
  "email": "admin@masociete-vtc.com",
  "username": "admin_masociete_vtc",
  "status": "active",
  "created_at": "2025-11-26T10:00:00Z"
}
```

### POST `/api/tenants/{id}/reset_admin_password/`

Réinitialise le mot de passe de l'admin du tenant.

**Body :**
```json
{
  "password": "admin123"  // Optionnel, défaut: admin123
}
```

**Réponse :**
```json
{
  "status": "Password reset successfully",
  "email": "admin@masociete-vtc.com",
  "password": "admin123",
  "message": "Le mot de passe de admin@masociete-vtc.com a été réinitialisé."
}
```

## 🔒 Sécurité

- ⚠️ **Seuls les super admins** peuvent accéder à ces fonctionnalités
- ⚠️ Le mot de passe n'est jamais stocké en clair dans la base de données
- ⚠️ Le mot de passe affiché après réinitialisation est celui que vous avez défini

## 💡 Cas d'Usage

1. **Test rapide** : Réinitialiser le mot de passe pour tester la connexion
2. **Debug** : Vérifier les informations de l'admin (email, statut)
3. **Support** : Aider un tenant à récupérer l'accès à son compte
4. **Développement** : Utiliser un mot de passe connu pour les tests

## 📝 Exemple d'Utilisation

1. Ouvrez un tenant dans l'interface super admin
2. Dans la section "Informations Admin (Debug)" :
   - Vous voyez l'email et le username de l'admin
   - Vous pouvez modifier le mot de passe (par défaut: `admin123`)
   - Cliquez sur "Réinitialiser"
   - Le mot de passe est réinitialisé et affiché
3. Utilisez ces identifiants pour vous connecter sur `/login`

## 🚨 Notes

- Le mot de passe est réinitialisé **immédiatement** après confirmation
- Le statut de l'utilisateur est automatiquement mis à `active`
- Si aucun admin n'existe pour le tenant, un message d'erreur s'affiche

---

**Date** : 2025-11-26  
**Status** : ✅ Implémenté et fonctionnel

