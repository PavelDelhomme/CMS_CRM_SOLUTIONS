# Référence API Django (référence pour la migration Rust)

Document généré pour la **Phase 0** de la migration Strangler fig. Ce document décrit les endpoints de l’API Django actuelle afin de reproduire le même contrat dans le backend Rust.

**Source** : `backend-django/config/core/urls.py`, `apps/api/urls.py`, `apps/plugins/urls.py`. Schéma OpenAPI/Swagger disponible en dev : `GET /api/docs/` (drf-yasg).

---

## 1. Bounded contexts (domaines métier)

| Contexte | Préfixe / ressources | Description |
|----------|----------------------|-------------|
| **auth** | `auth/token/`, `auth/token/refresh/`, `auth/login/`, `auth/register/` | JWT, login, inscription (email + mot de passe, création tenant possible). |
| **tenants** | `tenants/` | CRUD tenants (schéma public) ; super-admin uniquement pour liste/création. |
| **system-settings** | `system-settings/` | Paramètres système (singleton) ; schéma public. |
| **pages (CMS)** | `pages/` | CRUD pages par tenant ; statut, slug, contenu. |
| **content/blocs** | (intégré aux pages ou bloc-types) | Blocs : voir `apps/blocks` (BlockType, BlockTemplate) ; pas exposé sous `/api/` dans les urls actuelles — à vérifier (templates, blocks). |
| **media** | `media/` | Upload et liste des médias par tenant. |
| **services** | `services/` | CRUD services par tenant. |
| **bookings** | `bookings/` | CRUD réservations par tenant. |
| **billing** | (app `billing` : PricingPlan, Subscription, Invoice, Payment, PaymentMethod, InvoiceTemplate) | Plans, abonnements, factures, paiements, Stripe. Endpoints possibles : `pricing-plans/`, `subscriptions/`, `invoices/`, `billing/stats/`, `billing/unpaid-items/` — à confirmer selon l’inclusion réelle des URLs billing dans le routeur. |
| **plugins** | `plugins/`, `templates/`, `installed-templates/` | Plugins installés, templates, templates installés par tenant. |
| **stats** | `stats/dashboard/` | Statistiques dashboard (super-admin : tous tenants, sinon tenant courant). |

---

## 2. Endpoints détaillés (structure actuelle)

Base URL : `/api/` (sous le backend Django). Authentification : **JWT** (Bearer) sauf pour `auth/login`, `auth/register`, `auth/token/`.

### 2.1 Auth

| Méthode | Chemin | Description | Corps / Réponse |
|---------|--------|-------------|------------------|
| POST | `auth/token/` | Obtention du couple access/refresh JWT (SimpleJWT) | Body: `username`, `password` (ou email selon custom). Response: `access`, `refresh`. |
| POST | `auth/token/refresh/` | Refresh du token access | Body: `refresh`. Response: `access`. |
| POST | `auth/login/` | Login custom (email) ; peut créer tenant + subscription | Voir `apps.tenants.views.auth` (login_view). |
| POST | `auth/register/` | Inscription ; peut créer tenant + plan trial | Voir `apps.tenants.views.auth` (register_view). |

### 2.2 Tenants (schéma public)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `tenants/` | Liste tenants (super-admin ou filtré). |
| POST | `tenants/` | Création tenant (super-admin). |
| GET | `tenants/{id}/` | Détail tenant. |
| PATCH/PUT | `tenants/{id}/` | Mise à jour tenant. |
| DELETE | `tenants/{id}/` | Suppression tenant. |

### 2.3 System settings (schéma public)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `system-settings/` | Liste (singleton) ou détail. |
| PATCH/PUT | `system-settings/{id}/` | Mise à jour paramètres système. |

### 2.4 Pages (CMS, par tenant)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `pages/` | Liste pages (contexte tenant ; super-admin peut passer `tenant_id`). |
| POST | `pages/` | Création page. |
| GET | `pages/{id}/` | Détail page. |
| PATCH/PUT | `pages/{id}/` | Mise à jour page. |
| DELETE | `pages/{id}/` | Suppression page. |

### 2.5 Users (par tenant)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `users/` | Liste utilisateurs du tenant (ou tous pour super-admin). |
| POST | `users/` | Création utilisateur. |
| GET | `users/{id}/` | Détail utilisateur. |
| PATCH/PUT | `users/{id}/` | Mise à jour utilisateur. |
| DELETE | `users/{id}/` | Suppression utilisateur. |

### 2.6 Media

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `media/` | Liste médias (tenant). |
| POST | `media/` | Upload fichier. |
| GET | `media/{id}/` | Détail / téléchargement. |
| PATCH/PUT | `media/{id}/` | Mise à jour. |
| DELETE | `media/{id}/` | Suppression. |

### 2.7 Services

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `services/` | Liste services (tenant). |
| POST | `services/` | Création service. |
| GET | `services/{id}/` | Détail. |
| PATCH/PUT | `services/{id}/` | Mise à jour. |
| DELETE | `services/{id}/` | Suppression. |

### 2.8 Bookings

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `bookings/` | Liste réservations (tenant). |
| POST | `bookings/` | Création réservation. |
| GET | `bookings/{id}/` | Détail. |
| PATCH/PUT | `bookings/{id}/` | Mise à jour. |
| DELETE | `bookings/{id}/` | Suppression. |

### 2.9 Plugins & templates

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET/POST | `plugins/` | Liste / création plugins installés. |
| GET/PATCH/DELETE | `plugins/{id}/` | Détail / mise à jour / suppression. |
| GET/POST | `templates/` | Templates. |
| GET/PATCH/DELETE | `templates/{id}/` | Détail template. |
| GET/POST | `installed-templates/` | Templates installés (par tenant). |
| GET/PATCH/DELETE | `installed-templates/{id}/` | Détail. |

### 2.10 Stats

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `stats/dashboard/` | Statistiques dashboard (tenant ou global super-admin). |

### 2.11 Billing (app billing — à brancher si pas déjà exposé)

Si les vues billing sont montées sous `/api/` (p.ex. via un routeur séparé ou include) :

- `pricing-plans/` : CRUD plans tarifaires (super-admin pour tout, tenant pour liste active).
- `subscriptions/` : CRUD abonnements (tenant, cycle monthly/yearly, Stripe).
- `invoices/` : Liste / détail factures (read-only côté API).
- `payments/` : Liste paiements.
- `payment-methods/` : Moyens de paiement.
- `invoice-templates/` : Templates de facture (super-admin).
- `billing/stats/` : Statistiques facturation (super-admin).
- `billing/unpaid-items/` : Éléments impayés (super-admin).

Actions custom possibles : cancel, reactivate, suspend, change_plan sur subscriptions ; mark_paid, send_reminder sur invoices. Référence : `apps/billing/views.py`.

---

## 3. Authentification et multi-tenant

- **JWT** : header `Authorization: Bearer <access_token>`. Access token court ; refresh via `auth/token/refresh/`.
- **Tenant** : identifié par le middleware django-tenants (sous-domaine ou `X-Tenant` / domaine selon config). Le backend Rust devra lire le schéma PostgreSQL correspondant au tenant (même schémas que Django).
- **Rôles** : super-admin (accès schéma public + tous tenants), tenant admin, user. Permissions à reproduire côté Rust.

---

## 4. Ordre suggéré pour la migration (Strangler fig)

1. **Auth** : `auth/token/`, `auth/token/refresh/`, `auth/login/`, `auth/register/` — premier module Rust.
2. **Tenants** : `tenants/` (lecture/création pour super-admin).
3. **System settings** : `system-settings/`.
4. **Pages** : `pages/` (CRUD par tenant).
5. **Users** : `users/`.
6. **Media** : `media/`.
7. **Services** : `services/`.
8. **Bookings** : `bookings/`.
9. **Billing** : pricing-plans, subscriptions, invoices, webhooks Stripe.
10. **Plugins / templates** : `plugins/`, `templates/`, `installed-templates/`.
11. **Stats** : `stats/dashboard/`.

---

**Dernière mise à jour** : Phase 0 (2026-02-20). À compléter avec les schémas de sérialisation (request/response) depuis les serializers Django ou depuis `/api/docs/` (Swagger).
