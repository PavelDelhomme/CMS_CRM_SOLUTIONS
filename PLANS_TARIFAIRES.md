# 💳 Plans Tarifaires VTCBuilder

## 📋 Plans Disponibles

### Starter - 29,90€/mois
**Parfait pour débuter votre activité VTC**

- ✅ 1 site VTC
- ✅ 1 utilisateur (admin seulement)
- ✅ 5 Go de stockage
- ✅ Gestion des services VTC
- ✅ Système de réservation
- ✅ Gestion des médias
- ✅ Templates de base
- ✅ Support par email

### Business - 59,90€/mois ⭐ POPULAIRE
**Pour les professionnels VTC qui veulent développer leur activité**

- ✅ 1 site VTC
- ✅ 3 utilisateurs (admin + 2 collaborateurs)
- ✅ 20 Go de stockage
- ✅ Gestion des services VTC illimités
- ✅ Système de réservation avancé
- ✅ Gestion des médias
- ✅ Templates premium
- ✅ Statistiques détaillées
- ✅ Support prioritaire

### Enterprise - 129,90€/mois
**Pour les grandes entreprises VTC**

- ✅ Jusqu'à 3 sites VTC
- ✅ 10 utilisateurs (admin + équipe)
- ✅ 100 Go de stockage
- ✅ Services VTC illimités
- ✅ Système de réservation avancé
- ✅ Templates premium + personnalisation
- ✅ Statistiques avancées
- ✅ API personnalisée
- ✅ Support dédié 24/7
- ✅ Gestion multi-flotte

## 🔧 Initialisation des Plans

Pour créer ou mettre à jour les plans tarifaires :

```bash
docker exec vtcbuilder_backend python manage.py init_pricing_plans
```

Pour réinitialiser complètement les plans :

```bash
docker exec vtcbuilder_backend python manage.py init_pricing_plans --reset
```

## 📊 Quotas et Limites

### Vérification des Quotas

Le système vérifie automatiquement les quotas lors de :
- ✅ Création d'utilisateurs
- ✅ Ajout de contenu (à venir)
- ✅ Upload de médias (à venir)

### Quotas par Plan

| Plan | Utilisateurs | Sites | Stockage |
|------|--------------|-------|----------|
| Starter | 1 | 1 | 5 Go |
| Business | 3 | 1 | 20 Go |
| Enterprise | 10 | 3 | 100 Go |

### Messages d'Erreur

Si un quota est atteint, l'utilisateur recevra un message clair :
- "Quota d'utilisateurs atteint (X/Y). Veuillez passer à un plan supérieur pour ajouter plus d'utilisateurs."

## 🎯 Plan Populaire

Le plan **Business** est marqué comme "Populaire" (`is_featured = True`) :
- Badge "Populaire" visible dans l'interface
- Mise en avant visuelle (bordure bleue)
- Recommandé par défaut

## 💡 Gestion des Abonnements

### Création d'un Abonnement

Quand un tenant s'abonne à un plan :
- Une `Subscription` est créée
- Les quotas sont appliqués automatiquement
- Le tenant peut gérer son abonnement depuis `/dashboard/billing`

### Changement de Plan

- Un tenant peut passer à un plan supérieur à tout moment
- Les quotas sont mis à jour immédiatement
- Facturation au prorata (à implémenter avec Stripe)

## 🔐 Implémentation Technique

### Module de Quota

Le module `tenants/quota.py` fournit :
- `get_tenant_quota(tenant)` : Récupère les quotas du tenant
- `check_user_quota(tenant)` : Vérifie si on peut ajouter un utilisateur
- `check_storage_quota(tenant, size_bytes)` : Vérifie si on peut ajouter du stockage

### Vérification Automatique

La vérification se fait dans :
- `UserSerializer.create()` : Vérifie le quota avant de créer un utilisateur
- `UserViewSet.create()` : Double vérification au niveau API

## 📝 Notes

- Les quotas sont basés sur la `Subscription` active du tenant
- Si pas d'abonnement, les quotas par défaut sont appliqués (1 utilisateur, 1 site, 1 Go)
- Les super-admins ne sont pas comptés dans les quotas
- Le système bloque la création si le quota est atteint

---

**Date** : 2025-11-26  
**Status** : ✅ Implémenté et fonctionnel

