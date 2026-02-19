# 💳 Système de Facturation CMS CRM Solutions

Documentation complète du système de facturation, paiement et plans tarifaires.

## 📋 Vue d'ensemble

Le système de facturation comprend :
- **Plans tarifaires** : Starter, Business, Enterprise
- **Abonnements** : Gestion des abonnements des tenants
- **Factures** : Génération et gestion des factures
- **Paiements** : Suivi des paiements
- **Méthodes de paiement** : Carte bancaire, virement, PayPal, etc.

## 🗂️ Modèles

### PricingPlan
Plan tarifaire avec prix mensuel/annuel, limites (sites, utilisateurs, stockage), et fonctionnalités.

### Subscription
Abonnement d'un tenant à un plan, avec statut (trial, active, cancelled, etc.) et dates de période.

### Invoice
Facture liée à un abonnement, avec montants (sous-total, taxe, total) et statut.

### Payment
Paiement lié à une facture, avec méthode de paiement et statut.

### PaymentMethod
Méthode de paiement disponible (Stripe, virement, PayPal, etc.) avec configuration.

## 🔌 API Endpoints

### Plans Tarifaires
- `GET /api/pricing-plans/` : Liste des plans
- `POST /api/pricing-plans/` : Créer un plan (super admin)
- `GET /api/pricing-plans/{id}/` : Détails d'un plan
- `PUT /api/pricing-plans/{id}/` : Modifier un plan (super admin)
- `DELETE /api/pricing-plans/{id}/` : Supprimer un plan (super admin)
- `POST /api/pricing-plans/{id}/move_up/` : Déplacer vers le haut
- `POST /api/pricing-plans/{id}/move_down/` : Déplacer vers le bas

### Abonnements
- `GET /api/subscriptions/` : Liste des abonnements
- `POST /api/subscriptions/` : Créer un abonnement
- `GET /api/subscriptions/{id}/` : Détails d'un abonnement
- `PUT /api/subscriptions/{id}/` : Modifier un abonnement
- `GET /api/subscriptions/tenants_without_subscription/` : Tenants sans abonnement
- `POST /api/subscriptions/{id}/cancel/` : Annuler un abonnement
- `POST /api/subscriptions/{id}/reactivate/` : Réactiver un abonnement
- `POST /api/subscriptions/{id}/activate/` : Activer (trial -> active)
- `POST /api/subscriptions/{id}/suspend/` : Suspendre (active -> past_due)
- `POST /api/subscriptions/{id}/update_plan/` : Changer de plan
- `POST /api/subscriptions/{id}/update_status/` : Modifier le statut (admin)
- `GET /api/subscriptions/{id}/details/` : Détails complets avec factures et paiements

### Factures
- `GET /api/invoices/` : Liste des factures
- `GET /api/invoices/{id}/` : Détails d'une facture
- `POST /api/invoices/generate/` : Générer une nouvelle facture
- `POST /api/invoices/{id}/mark_paid/` : Marquer comme payée (admin)
- `POST /api/invoices/{id}/send_reminder/` : Envoyer un rappel de paiement
- `GET /api/invoices/{id}/download_pdf/` : Télécharger le PDF

### Paiements
- `GET /api/payments/` : Liste des paiements
- `GET /api/payments/{id}/` : Détails d'un paiement

### Méthodes de Paiement
- `GET /api/payment-methods/` : Liste des méthodes
- `POST /api/payment-methods/` : Créer une méthode (super admin)
- `GET /api/payment-methods/{id}/` : Détails d'une méthode
- `PUT /api/payment-methods/{id}/` : Modifier une méthode (super admin)
- `POST /api/payment-methods/{id}/toggle_enabled/` : Activer/désactiver

## 🚀 Initialisation

### Plans Tarifaires
```bash
python manage.py init_pricing_plans
# Avec reset pour supprimer les anciens :
python manage.py init_pricing_plans --reset
```

### Méthodes de Paiement
```bash
python manage.py init_payment_methods
# Avec reset pour supprimer les anciennes :
python manage.py init_payment_methods --reset
```

## 📝 Exemples d'utilisation

### Créer un abonnement
```python
POST /api/subscriptions/
{
  "tenant_id": 1,
  "plan_id": 2,
  "billing_cycle": "monthly",
  "status": "trial"
}
```

### Générer une facture
```python
POST /api/invoices/generate/
{
  "subscription_id": 1,
  "amount": 59.90,
  "tax_rate": 20.0
}
```

### Marquer une facture comme payée
```python
POST /api/invoices/{id}/mark_paid/
{
  "payment_method": "stripe",
  "paid_at": "2025-12-01T10:00:00Z"
}
```

## 🔐 Permissions

- **Super Admin** : Accès complet (créer/modifier/supprimer plans, méthodes, gérer tous les abonnements)
- **Tenant Admin** : Voir et gérer son propre abonnement, factures et paiements
- **Autres utilisateurs** : Lecture seule de leur abonnement

## 🔄 Workflow

1. **Création d'un tenant** → Abonnement en trial automatique (si configuré)
2. **Fin du trial** → Génération d'une facture
3. **Paiement** → Facture marquée comme payée, abonnement activé
4. **Renouvellement** → Génération automatique de facture à chaque période

## 📊 Statistiques

Les statistiques de facturation sont disponibles via :
- `GET /api/stats/detailed/` : Statistiques détaillées incluant revenus
- `GET /api/subscriptions/{id}/details/` : Résumé d'un abonnement

## 🛠️ Configuration Stripe

Pour activer les paiements Stripe, configurer dans `settings_app` :
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 📚 Notes

- Les factures sont générées automatiquement lors du renouvellement
- Les paiements peuvent être manuels (virement, chèque) ou automatiques (Stripe)
- Les méthodes de paiement peuvent être activées/désactivées par tenant
- Les frais de transaction sont calculés automatiquement selon la méthode

