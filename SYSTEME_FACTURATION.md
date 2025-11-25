# 💳 Système de Facturation - Documentation

## ✅ Implémentation Complète

### 1. Backend - Modèles Billing

#### PricingPlan (Plans Tarifaires)
- ✅ Nom, slug, description
- ✅ Prix mensuel et annuel
- ✅ Limites : sites, utilisateurs, stockage
- ✅ Features (JSON)
- ✅ Status actif/inactif

#### Subscription (Abonnements)
- ✅ Lien OneToOne avec Tenant
- ✅ Plan associé
- ✅ Status : trial, active, past_due, cancelled, expired
- ✅ Cycle : monthly, yearly
- ✅ Dates : trial, période actuelle, annulation
- ✅ Intégration Stripe (préparée)

#### Invoice (Factures)
- ✅ Lien avec Subscription et Tenant
- ✅ Numéro de facture unique
- ✅ Montants : subtotal, tax, total
- ✅ Dates : émission, échéance, paiement
- ✅ Status : draft, open, paid, void, uncollectible
- ✅ PDF URL

#### Payment (Paiements)
- ✅ Lien avec Invoice et Tenant
- ✅ Montant, devise, méthode
- ✅ Status : pending, processing, succeeded, failed, refunded
- ✅ Intégration Stripe (préparée)

### 2. Backend - API Endpoints

#### Pricing Plans
- ✅ `GET /api/pricing-plans/` - Liste des plans
- ✅ `GET /api/pricing-plans/{id}/` - Détails d'un plan
- ✅ `POST /api/pricing-plans/` - Créer un plan (super admin)
- ✅ `PUT /api/pricing-plans/{id}/` - Modifier un plan (super admin)

#### Subscriptions
- ✅ `GET /api/subscriptions/` - Liste des abonnements (filtrée par tenant)
- ✅ `GET /api/subscriptions/{id}/` - Détails d'un abonnement
- ✅ `POST /api/subscriptions/` - Créer un abonnement
- ✅ `POST /api/subscriptions/{id}/cancel/` - Annuler un abonnement
- ✅ `POST /api/subscriptions/{id}/reactivate/` - Réactiver (super admin)

#### Invoices
- ✅ `GET /api/invoices/` - Liste des factures (filtrée par tenant)
- ✅ `GET /api/invoices/{id}/` - Détails d'une facture
- ✅ `POST /api/invoices/{id}/mark_paid/` - Marquer comme payée (super admin)

#### Payments
- ✅ `GET /api/payments/` - Liste des paiements (filtrée par tenant)
- ✅ `GET /api/payments/{id}/` - Détails d'un paiement

#### Statistiques
- ✅ `GET /api/billing/stats/` - Statistiques globales (super admin)
  - Revenus totaux
  - Revenus mensuels
  - Abonnements actifs
  - Paiements en attente
  - Factures impayées

### 3. Frontend - Interface Tenant (`/dashboard/billing`)

#### Onglets
- ✅ **Mon Abonnement** : Affiche l'abonnement actuel, possibilité d'annuler
- ✅ **Factures** : Liste des factures avec statut et téléchargement PDF
- ✅ **Paiements** : Historique des paiements
- ✅ **Plans Disponibles** : Comparaison et changement de plan

#### Fonctionnalités
- ✅ Voir l'abonnement actuel avec détails
- ✅ Changer de plan
- ✅ Annuler l'abonnement
- ✅ Consulter les factures
- ✅ Voir l'historique des paiements
- ✅ Comparer les plans disponibles

### 4. Frontend - Interface Admin (`/admin/billing`)

#### Onglets
- ✅ **Vue d'ensemble** : Statistiques globales (revenus, abonnements, etc.)
- ✅ **Abonnements** : Liste de tous les abonnements avec actions
- ✅ **Factures** : Toutes les factures avec possibilité de marquer comme payée
- ✅ **Paiements** : Tous les paiements
- ✅ **Plans Tarifaires** : Gestion des plans (création/modification à venir)

#### Fonctionnalités Super Admin
- ✅ Voir toutes les statistiques de facturation
- ✅ Gérer tous les abonnements
- ✅ Marquer les factures comme payées
- ✅ Réactiver les abonnements annulés
- ✅ Voir tous les paiements

## 🔄 Workflow de Facturation

### Pour un Tenant

1. **Souscription** :
   - Le tenant choisit un plan dans `/dashboard/billing`
   - Un abonnement est créé (status: trial ou active)
   - Une facture est générée automatiquement

2. **Paiement** :
   - Le tenant paie via l'interface (intégration Stripe à venir)
   - Le paiement est enregistré
   - La facture est marquée comme payée

3. **Renouvellement** :
   - Automatique selon le cycle (mensuel/annuel)
   - Nouvelle facture générée
   - Paiement automatique si configuré

4. **Gestion** :
   - Le tenant peut changer de plan
   - Le tenant peut annuler son abonnement
   - Accès à l'historique complet

### Pour le Super Admin

1. **Vue Globale** :
   - Statistiques en temps réel
   - Revenus totaux et mensuels
   - Abonnements actifs
   - Factures impayées

2. **Gestion** :
   - Voir tous les abonnements
   - Réactiver des abonnements annulés
   - Marquer des factures comme payées
   - Gérer les plans tarifaires

## 🚀 Prochaines Étapes

### Intégration Paiement (Stripe)
- [ ] Configuration Stripe (clés API)
- [ ] Création de PaymentIntent
- [ ] Webhooks Stripe pour les événements
- [ ] Interface de paiement sécurisée
- [ ] Paiements récurrents automatiques

### Fonctionnalités Avancées
- [ ] Génération automatique de factures PDF
- [ ] Emails automatiques pour factures
- [ ] Rappels de paiement
- [ ] Gestion des remises et coupons
- [ ] Export des données de facturation

---

**✅ Le système de facturation de base est maintenant opérationnel !**

Les tenants peuvent voir leur abonnement et factures, et le super admin a une vue complète de toute la facturation.

