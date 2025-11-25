# 🔄 Système de Soft Delete pour Tenants - Documentation

## ✅ Implémentation Complète

### 1. Modèle Tenant

- ✅ Ajout du champ `deleted_at` (DateTimeField, nullable)
- ✅ Ajout du statut `'deleted'` dans STATUS_CHOICES
- ✅ Méthodes `is_deleted()`, `soft_delete()`, `restore()`

### 2. Backend API

#### Soft Delete (destroy)
- ✅ `destroy()` effectue maintenant un soft delete au lieu d'une suppression définitive
- ✅ Vérifie si le tenant a un abonnement actif :
  - Si oui → désactive les utilisateurs au lieu de les supprimer
  - Si non → soft delete simple
- ✅ Retourne un message indiquant que le tenant peut être restauré pendant 1 mois

#### Restauration (restore)
- ✅ Nouvelle action `restore()` pour restaurer un tenant supprimé
- ✅ Réactive automatiquement les utilisateurs désactivés lors de la suppression
- ✅ Seul le super admin peut restaurer

#### Filtrage
- ✅ Les tenants soft deleted sont exclus par défaut de la liste
- ✅ Le super admin peut voir tous les tenants (y compris supprimés) avec `?show_deleted=true`

### 3. Commande de Purge

- ✅ Commande `purge_deleted_tenants` créée
- ✅ Supprime définitivement les tenants supprimés depuis plus d'1 mois (par défaut)
- ✅ Option `--dry-run` pour voir ce qui sera supprimé sans supprimer
- ✅ Option `--days` pour changer le délai (par défaut 30 jours)

### 4. Frontend

- ✅ Message de confirmation modifié pour indiquer que c'est un soft delete
- ✅ Bouton "Restaurer" pour les tenants supprimés
- ✅ Affichage conditionnel : si `tenant.deleted_at` existe, affiche le bouton restaurer
- ✅ Message informatif après suppression

## 📋 Utilisation

### Supprimer un Tenant (Soft Delete)

1. Aller sur `/admin/tenants`
2. Cliquer sur l'icône poubelle 🗑️ pour un tenant
3. Confirmer en tapant "SUPPRIMER"
4. Le tenant est marqué comme supprimé (soft delete)
5. Il sera définitivement supprimé après 1 mois

### Restaurer un Tenant

1. Aller sur `/admin/tenants?show_deleted=true` (pour voir les tenants supprimés)
2. Cliquer sur l'icône de restauration 🔄 pour un tenant supprimé
3. Le tenant est restauré et les utilisateurs sont réactivés

### Purger les Tenants Supprimés (après 1 mois)

```bash
# Voir ce qui sera supprimé (dry-run)
docker exec vtcbuilder_backend python manage.py purge_deleted_tenants --dry-run

# Supprimer définitivement les tenants supprimés depuis plus d'1 mois
docker exec vtcbuilder_backend python manage.py purge_deleted_tenants

# Supprimer définitivement les tenants supprimés depuis plus de 60 jours
docker exec vtcbuilder_backend python manage.py purge_deleted_tenants --days 60
```

## 🔒 Logique de Suppression

### Si le Tenant a un Abonnement Actif

- Les utilisateurs sont **désactivés** (status = 'inactive')
- Le tenant est marqué comme supprimé
- Le tenant peut être restauré → les utilisateurs seront réactivés

### Si le Tenant n'a pas d'Abonnement Actif

- Le tenant est simplement marqué comme supprimé
- Les utilisateurs restent actifs (seront supprimés lors de la purge)
- Le tenant peut être restauré

### Après 1 Mois (Purge)

- Suppression définitive du tenant
- Suppression de tous les utilisateurs associés
- Suppression de tous les tokens
- Suppression du schéma PostgreSQL
- **Irréversible**

## 🧹 Nettoyage Effectué

- ✅ Tenant "DelhommeVTC" (ID: 4) supprimé définitivement car problématique

---

**✅ Le système de soft delete est maintenant opérationnel !**

Les tenants peuvent être supprimés de manière réversible pendant 1 mois, puis sont purgés définitivement.

