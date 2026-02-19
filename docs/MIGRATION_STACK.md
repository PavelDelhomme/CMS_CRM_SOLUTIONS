# Plan de migration vers une stack plus performante (Rust / Go + frontend efficace)

Ce document décrit une **stratégie de migration** vers un backend plus léger (Rust, Go ou C++) et un frontend plus efficace qu’HTML/CSS/JS pur, **sans perdre aucune fonctionnalité** actuelle, et en gardant **Docker** pour l’orchestration. Il complète **PERFORMANCE_OPTIONS.md** (comparatif des options).

---

## 1. Objectifs

- **Backend** : langage plus bas niveau (Rust, Go, C++) pour réduire RAM/CPU et améliorer fluidité.
- **Frontend** : framework moderne et efficace (pas du HTML/CSS/JS pur, trop pénible pour un dashboard + éditeur de blocs), tout en restant plus léger/fluide que possible.
- **Contraintes** :
  - **Aucune perte de fonctionnalité** (multi-tenant, CMS, blocs, réservations, facturation Stripe, admin, plugins).
  - **Tout sous Docker** (conteneurisation et orchestration).
  - Migration réalisable par étapes (pas obligatoirement un big-bang).

---

## 2. Choix techniques recommandés pour la migration

### Backend (par ordre de pertinence pour “moins coûteux” + maintenabilité)

| Option | RAM typique | Écosystème multi-tenant / ORM / admin | Effort migration | Commentaire |
|--------|-------------|--------------------------------------|------------------|-------------|
| **Rust** (Axum + SQLx ou Diesel) | ~10–25 MB | À construire (schémas PG possibles) | Très élevé | Meilleur rapport perf/maintenabilité parmi les bas niveau. |
| **Go** (Gin / Fiber + GORM ou sqlx) | ~15–35 MB | À construire (multi-tenant par schémas PG) | Élevé | Très bon compromis, écosystème riche. |
| **C++** (custom ou libs HTTP) | ~5–20 MB | Quasi inexistant pour CMS/CRM | Très élevé | Max perf mais coût de dev et risque d’erreurs. |

- **Recommandation** : **Rust (Axum)** ou **Go (Gin/Fiber)**. PostgreSQL reste la BDD (schémas par tenant = même modèle qu’aujourd’hui).

### Frontend (efficace mais pas “pur HTML/CSS/JS”)

- **Éviter** : HTML/CSS/JS pur (trop lourd à gérer pour dashboard + éditeur de blocs, auth, API).
- **Options** :
  - **SvelteKit** : bon compromis RAM/perf, SSR, agréable à maintenir.
  - **Next.js (actuel)** : déjà en place ; garder en l’état si la migration backend suffit.
  - **Vue 3 + Vite** ou **React + Vite** : plus léger en dev que Next dev ; migration possible si on vise une SPA + API backend.

- **Recommandation** : soit **garder Next.js** et se concentrer sur la migration backend, soit **migrer vers SvelteKit** si on veut aussi réduire la charge frontend.

### Base de données, cache, orchestration

- **PostgreSQL** : conserver (schémas multi-tenant, pas d’équivalent simple en MySQL/MariaDB pour ce modèle).
- **Redis** : conserver (cache, sessions, broker Celery si besoin).
- **Orchestration** : **Docker Compose** (ou Swarm/Kubernetes si la taille du projet évolue), tout reste en conteneurs.

---

## 3. Stratégies de migration (sans perdre de fonctionnalités)

### Option A : Migration progressive (recommandée)

1. **Garder le projet actuel** (Django + Next.js) comme référence et production.
2. **Ajouter un second backend** (ex. Rust Axum ou Go Gin) dans le même repo ou un repo dédié :
   - Exposer la même API REST (auth JWT, tenants, pages, blocs, billing, etc.) en réimplémentant les endpoints au fur et à mesure.
   - Utiliser la **même base PostgreSQL** (même schémas tenants) pour que les deux backends puissent coexister (ou lire/écrire en parallèle pendant la transition).
3. **Router** (Nginx ou Traefik) : envoyer une partie du trafic vers le nouveau backend (ex. par path ou header) pour valider sans couper l’existant.
4. **Checklist fonctionnelle** : pour chaque module (auth, tenants, pages, blocs, médias, réservations, facturation, admin), valider la parité avant de basculer.
5. **Frontend** : soit continuer à parler à l’API Django, soit basculer progressivement vers la nouvelle API (même contrat d’API pour limiter les changements front).
6. **Arrêt de Django** : une fois la parité validée et les tests E2E verts, couper le trafic vers l’ancien backend et garder Docker pour le nouveau stack.

### Option B : Réécriture ciblée (nouveau backend + même front ou nouveau front)

1. **Spécifier l’API** : documenter tous les endpoints et modèles (OpenAPI/Swagger à partir de l’existant).
2. **Développer le nouveau backend** (Rust/Go) avec la même API et le même modèle de données (PostgreSQL, schémas).
3. **Tester** : reprendre les tests E2E et les scénarios métier pour garantir zéro régression.
4. **Frontend** : soit garder Next.js en ne changeant que l’URL de l’API, soit migrer vers SvelteKit/Vite en réutilisant les mêmes appels API.
5. **Docker** : un seul `docker-compose` avec le nouveau backend + frontend + PostgreSQL + Redis.

### Option C : Strangler fig (par domaine métier)

1. Identifier des **bounded contexts** (ex. auth, pages/CMS, billing, bookings).
2. Implémenter le nouveau backend **module par module** (ex. d’abord auth + JWT, puis pages, puis billing).
3. Router (Nginx/Traefik) : envoyer `/api/auth/*` vers le nouveau backend, le reste vers Django ; étendre progressivement.
4. Garder **une seule base PostgreSQL** (même schémas) ; le nouveau backend lit/écrit les mêmes tables/schémas que Django pendant la transition.
5. Valider chaque module (tests E2E, Stripe webhooks) avant de passer au suivant.

### Option D : Canary / pourcentage de trafic

1. Nouveau backend déployé en parallèle (même API, même DB).
2. Router : envoyer X % du trafic (ex. 5 %, puis 20 %, 50 %) vers le nouveau backend selon header ou cookie.
3. Monitorer erreurs et perfs ; en cas de problème, revenir à 0 % vers le nouveau backend.
4. Bascule 100 % quand la parité et la stabilité sont validées.

### Option E : Migration frontend seule (backend Django conservé)

1. Garder Django + PostgreSQL + Redis.
2. Remplacer Next.js par **SvelteKit** (ou SolidStart / Qwik) en gardant la même API ; adapter les appels API et le rendu (SSR, auth, Stripe côté client).
3. Réduit la RAM frontend (dev et prod) sans toucher au backend.

---

## 4. Checklist “zéro perte de fonctionnalité”

À valider avant de considérer la migration terminée :

- [ ] **Multi-tenant** : création tenant, domaine/sous-domaine, isolation des données par schéma.
- [ ] **Auth** : inscription, connexion, JWT, refresh, reset password, rôles (admin tenant, super-admin).
- [ ] **CMS** : pages, contenu, médias, éditeur de blocs (création/édition/suppression, rendu).
- [ ] **Réservations / services** : si applicable (modules booking, services).
- [ ] **Facturation** : Stripe (abonnements, webhooks).
- [ ] **Admin** : interface d’administration (équivalent Django admin ou custom).
- [ ] **Plugins** : si l’architecture plugins est conservée, comportement identique.
- [ ] **Logs, cache, sessions** : Redis, niveau de log, CORS, sécurité (CORS, CSRF, headers).

---

## 5. Docker

- Tous les nouveaux services (backend Rust/Go, frontend SvelteKit ou Next) tournent en **conteneurs**.
- **Orchestration** : Docker Compose (recommandé pour la taille actuelle) ; Kubernetes/Swarm possibles plus tard.
- **Réseau** : même réseau Docker que PostgreSQL et Redis ; reverse proxy (Nginx/Traefik) devant backend et frontend.

---

## 6. Références

- **docs/PERFORMANCE_OPTIONS.md** : comparatif détaillé backend, frontend, BDD, cache, orchestration, **RAM typique** et **solution de paiement (Stripe)**.
- **docs/ARCHITECTURE.md** : architecture actuelle et contraintes (multi-tenant, blocs, plugins).
- **docs/architecture/ARCHITECTURE_BLOCKS.md**, **docs/PLUGINS_ARCHITECTURE.md** : contraintes fonctionnelles à respecter lors de la migration.

Ce plan permet d’envisager une migration vers une stack **Rust ou Go + frontend efficace** (SvelteKit ou Next conservé), **sans perdre de fonctionnalité** et en restant **100 % Docker**. Détail options techniques, RAM et Stripe : **PERFORMANCE_OPTIONS.md**.
