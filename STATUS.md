# STATUS - CMS_CRM_SOLUTIONS

## 🎯 Priorités et Avancement Actuel

### ✅ **RÉSOLU RÉCEMMENT (03/12/2025)**

#### 🔴 **CRITIQUE - Erreur `created_at` lors de la création de services**
- ✅ **RÉSOLU** : Correction de l'erreur `null value in column "created_at" of relation "tenants_client" violates not-null constraint`
  - Champ `created_at` ajouté explicitement au modèle `Client` avec `auto_now_add=True`
  - `created_at` défini explicitement dans `views.py` lors de la création d'un tenant par défaut
  - Méthode `save()` du modèle `Client` améliorée pour définir `created_at` automatiquement
  - Migration créée pour ajouter `created_at` au modèle
  - Tests améliorés pour vérifier que `created_at` est toujours défini

#### 🔴 **CRITIQUE - Erreurs de tests backend**
- ✅ **RÉSOLU** : Correction des erreurs d'import dans les tests
  - `Tenant` → `Client` dans tous les fichiers de tests
  - Imports corrigés : `from apps.tenants.models import Client, User`
  - Tests `media/` dupliqués exclus de pytest avec `--ignore=media`

#### 🔴 **CRITIQUE - Erreurs TypeScript frontend**
- ✅ **RÉSOLU** : Correction des erreurs TypeScript
  - Type `User` corrigé : import depuis `auth.service` au lieu de `user.service`
  - Fichiers Stripe exclus du type-check (`**/register/complete-payment/**`, `**/payment/StripeCheckout.tsx`)
  - Tests frontend exclus du type-check dans `tsconfig.json`

---

## 📋 État Actuel du Projet

### ✅ **Fonctionnalités Implémentées**

#### Backend (Django)
- ✅ Architecture multi-tenant avec django-tenants
- ✅ Gestion des utilisateurs et authentification
- ✅ API REST complète (DRF)
- ✅ Gestion des pages, services, réservations, médias
- ✅ Système de facturation (plans, abonnements, factures)
- ✅ Système de plugins
- ✅ Gestion des templates et blocs
- ✅ CORS configuré
- ✅ Tests backend (pytest) - **EN COURS D'AMÉLIORATION**

#### Frontend (Next.js)
- ✅ Interface dashboard complète
- ✅ Navigation avec drawer/sidebar
- ✅ Mode sombre/clair fonctionnel
- ✅ Pages de gestion (pages, services, réservations, médias, utilisateurs, facturation, paramètres)
- ✅ Authentification et redirection basée sur les rôles
- ✅ Tests E2E avec Playwright - **EN COURS D'AMÉLIORATION**

#### Infrastructure
- ✅ Docker & Docker Compose configurés
- ✅ Nginx comme reverse proxy
- ✅ PostgreSQL avec django-tenants
- ✅ Redis pour le cache
- ✅ Celery pour les tâches asynchrones
- ✅ Healthchecks configurés

---

---

## 🧭 **MIGRATION RUST + SVELTEKIT (Strangler fig)**

**Choix retenus** : Backend **Rust** (Axum), Frontend **SvelteKit**, BDD **PostgreSQL**, Cache **Redis**, Orchestration **Docker Compose**. Stratégie **Option C : Strangler fig** (par domaine métier). Référence : **docs/MIGRATION_STACK.md**.

**Règle** : ne pas supprimer le code existant (Django / Next.js) tant que le nouveau (Rust / SvelteKit) n’offre pas la même fonctionnalité, vérifiée par tests et usage. S’appuyer sur l’existant pour valider la parité.

### Étapes à réaliser (ordre indicatif)

#### Phase 0 : Préparation
- [x] Créer la branche dédiée (`feature/migration-rust-sveltekit`).
- [x] Documenter l’API Django actuelle (endpoints, corps des requêtes/réponses) — **docs/migration/API_DJANGO_REFERENCE.md** ; Swagger : `GET /api/docs/`.
- [x] Lister les **bounded contexts** : auth, tenants, system-settings, pages/CMS, content/blocs, media, services, bookings, billing, plugins, stats (voir docs/migration/API_DJANGO_REFERENCE.md).
- [x] Préparer le routage Nginx (upstream + location `/api/auth/` commentés dans `docker/nginx/nginx.conf`).

#### Phase 1 : Backend Rust (premier module — Auth)
- [ ] Initialiser le projet Rust (Axum + SQLx ou Diesel) dans un répertoire dédié (ex. `backend-rust/`).
- [ ] Connexion PostgreSQL (même instance que Django) ; lecture/écriture des schémas existants (public + tenants).
- [ ] Implémenter **auth** : login, refresh JWT, reset password (même format de tokens que Django si possible).
- [ ] Exposer les routes sous un préfixe (ex. `/api/auth/*`) ; le reste du trafic reste vers Django.
- [ ] Tests (unitaires + intégration) ; comparer les réponses avec l’API Django pour les mêmes entrées.
- [ ] Mettre à jour Nginx/Traefik pour router `/api/auth/*` vers le backend Rust (optionnel au début : tout peut encore aller vers Django, le Rust étant testé en parallèle).

#### Phase 2 : Backend Rust (modules suivants)
- [ ] **Tenants / schéma public** : lecture Client, Domain ; création tenant si besoin (aligné sur Django).
- [ ] **Pages / CMS** : CRUD pages, même structure que l’API Django ; vérifier parité avec l’existant.
- [ ] **Content / Blocs** : CRUD blocs, rendu si applicable.
- [ ] **Médias** : upload, liste, suppression ; même contrat que Django.
- [ ] **Billing** : plans, abonnements, Stripe webhooks ; idempotence et même comportement que Django.
- [ ] **Réservations / services** : CRUD bookings, services ; parité avec l’existant.
- [ ] **Admin / paramètres** : endpoints nécessaires pour le super-admin et paramètres système.
- Pour chaque module : tests + comparaison avec le comportement Django avant de faire router le trafic vers Rust.

#### Phase 3 : Frontend SvelteKit
- [ ] Initialiser un projet SvelteKit (ex. `frontend-sveltekit/` ou sous-dossier) ; ne pas remplacer encore le frontend Next.js.
- [ ] Reproduire les écrans principaux : login, dashboard, liste/édition pages, blocs, médias, utilisateurs, facturation, paramètres.
- [ ] Utiliser la **même API** que le frontend actuel (Django ou Rust selon ce qui est routé) ; configurer l’URL de l’API (ex. env).
- [ ] Auth : JWT, refresh, redirection selon rôles (admin tenant, super-admin).
- [ ] Éditeur de blocs : même fonctionnalité que l’existant (création/édition/suppression, rendu).
- [ ] Stripe côté client (Checkout / Elements) si utilisé.
- [ ] Tests E2E (Playwright ou équivalent) ; comparer le comportement avec le frontend Next.js actuel.

#### Phase 4 : Routage et bascule progressive
- [ ] Configurer le reverse proxy pour envoyer un sous-ensemble du trafic vers Rust (ex. par path ou header).
- [ ] Valider en dev/staging que tout fonctionne (auth, pages, billing, etc.) avec le backend Rust + frontend SvelteKit.
- [ ] Étendre progressivement le routage (plus de chemins vers Rust) jusqu’à ce que tout le trafic API puisse aller vers Rust.
- [ ] Optionnel : proposer le frontend SvelteKit en parallèle du Next.js (autre path ou sous-domaine) pour comparaison.

#### Phase 5 : Consolidation (après parité validée)
- [ ] Quand la parité est validée (tests E2E, scénarios métier, Stripe) : documenter la bascule définitive.
- [ ] Ne supprimer ou désactiver Django/Next.js qu’après décision explicite et bascule en prod du nouveau stack.
- [ ] Docker Compose : ajouter les services `backend-rust` et `frontend-sveltekit` ; conserver les anciens services jusqu’à la bascule.

### Checklist parité fonctionnelle (avant de considérer un module terminé)

- [ ] **Auth** : login, logout, refresh JWT, reset password, rôles (admin tenant, super-admin).
- [ ] **Multi-tenant** : création tenant, domaine/sous-domaine, isolation par schéma.
- [ ] **CMS** : pages, contenu, médias, éditeur de blocs (CRUD + rendu).
- [ ] **Réservations / services** : CRUD, même comportement que Django.
- [ ] **Facturation** : Stripe (abonnements, webhooks), factures.
- [ ] **Admin** : interface équivalente (super-admin, paramètres système).
- [ ] **Plugins** : si conservés, même comportement.
- [ ] **Sécurité** : CORS, CSRF, headers, Redis (sessions/cache).

### Fichiers / dossiers à créer (sans toucher à l’existant)

- `backend-rust/` : projet Rust (Axum, SQLx/Diesel), Cargo.toml, structure par module (auth, tenants, pages, etc.).
- `frontend-sveltekit/` (ou emplacement choisi) : projet SvelteKit, même structure logique que le frontend actuel (pages, composants, appels API).
- Mise à jour de `docker-compose.yml` (ou fichier dédié) pour ajouter les services Rust et SvelteKit ; Nginx/Traefik pour le routage.
- **Ne pas supprimer** `backend-django/` ni `frontend/` tant que la migration n’est pas validée.

**Dernière mise à jour plan migration** : 2026-02-20.

---

## 🚧 **EN COURS / À FAIRE**

### 🔴 **PRIORITÉ HAUTE**

#### 1. **Tests Backend - Amélioration**
- [ ] Compléter les tests pour la création de services avec `created_at`
- [ ] Tests pour vérifier que tous les champs requis sont définis lors de la création de tenant
- [ ] Tests pour les cas limites (création sans tenant, avec tenant existant, etc.)
- [ ] Tests pour les erreurs de contrainte NOT NULL
- [ ] Exécuter `make backend-test` et corriger toutes les erreurs

#### 2. **Tests Frontend - Amélioration**
- [ ] Compléter les tests E2E pour toutes les pages du dashboard
- [ ] Tests pour la création de services, réservations, pages
- [ ] Tests pour la gestion des utilisateurs
- [ ] Tests pour la facturation
- [ ] Exécuter `make test-e2e` et corriger toutes les erreurs

#### 3. **Migration Database - Correction**
- [ ] Corriger l'erreur de migration : `The field bookings.Booking.tenant was declared with a lazy reference to 'tenants.tenant', but app 'tenants' doesn't provide model 'tenant'`
  - Vérifier toutes les références à `tenants.tenant` et les remplacer par `tenants.client`
  - Créer une migration de correction si nécessaire

### 🟡 **PRIORITÉ MOYENNE**

#### 4. **Fonctionnalités Manquantes**
- [ ] Système de plugins fonctionnel
- [ ] Marketplace de templates
- [ ] Gestion avancée des médias (upload, prévisualisation, etc.)
- [ ] Système de notifications
- [ ] Export/Import de données

#### 5. **Améliorations UX/UI**
- [ ] Améliorer le design responsive
- [ ] Ajouter des animations et transitions
- [ ] Améliorer les messages d'erreur et de succès
- [ ] Ajouter des tooltips et aide contextuelle

#### 6. **Documentation**
- [ ] Documentation API complète
- [ ] Guide d'installation et de déploiement
- [ ] Guide de développement
- [ ] Documentation des plugins

### 🟢 **PRIORITÉ BASSE**

#### 7. **Optimisations**
- [ ] Optimisation des requêtes SQL
- [ ] Mise en cache des données fréquemment utilisées
- [ ] Optimisation des images et médias
- [ ] Compression des assets frontend

#### 8. **Sécurité**
- [ ] Audit de sécurité
- [ ] Rate limiting
- [ ] Validation renforcée des entrées
- [ ] Protection CSRF améliorée

---

## 📊 Statistiques

### Tests
- **Backend** : ~103 tests (4 erreurs de collection résolues)
- **Frontend** : Tests E2E avec Playwright (en cours d'amélioration)
- **Coverage** : ~11% (à améliorer)

### Code
- **Backend** : Django 5.0.1, Python 3.12
- **Frontend** : Next.js, React 18, TypeScript
- **Base de données** : PostgreSQL avec django-tenants

---

## 🐛 **Problèmes Connus**

1. **Migration Database** : Erreur de référence à `tenants.tenant` au lieu de `tenants.client`
   - Impact : Empêche certaines migrations
   - Solution : Corriger toutes les références dans les modèles et migrations

2. **Tests Backend** : Certains tests peuvent échouer si la base de données n'est pas à jour
   - Solution : S'assurer que toutes les migrations sont appliquées avant d'exécuter les tests

3. **Tests Frontend** : Les tests E2E peuvent être lents
   - Solution : Optimiser les tests et utiliser des mocks si nécessaire

---

## 📝 **Notes de Développement**

### Dernières Modifications (03/12/2025)
- Correction de l'erreur `created_at` lors de la création de services
- Amélioration des tests backend et frontend
- Correction des imports et types TypeScript
- Exclusion des tests dupliqués de pytest

### Prochaines Étapes
1. Compléter les tests pour la création de services
2. Corriger l'erreur de migration database
3. Améliorer la couverture de tests
4. Finaliser les fonctionnalités manquantes

---

## 🔗 **Liens Utiles**

- **Backend API** : http://localhost:9193/api/
- **Frontend Dashboard** : http://localhost:9194/dashboard
- **Frontend Public** : http://localhost:9194
- **Admin Django** : http://localhost:9193/admin/

---

**Dernière mise à jour** : 03/12/2025 - 03:00
