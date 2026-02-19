# ⚡ Comparatif complet : performance et coût en ressources

Ce document compare **toutes les options technologiques pertinentes** (backend, frontend, base de données, cache, orchestration) pour **minimiser l’usage CPU/RAM** et le coût d’exécution, en cohérence avec l’architecture visée décrite dans les `.md` à la racine et dans `docs/`. Tous les déploiements visés passent par **Docker** (conteneurisation et orchestration).

---

## 1. Architecture visée (rappel)

D’après **ARCHITECTURE.md**, **SYSTEM_OVERVIEW.md**, **CMS_CRM_SOLUTIONS_README.md**, **docs/architecture/** et **docs/PLUGINS_ARCHITECTURE.md** :

- **Produit** : plateforme **multi-tenant** type CMS/CRM (pages, blocs, réservations, facturation, utilisateurs par tenant).
- **Multi-tenant** : schémas PostgreSQL par tenant (django-tenants), domaine/sous-domaine par client.
- **Backend** : API REST, JWT, admin Django, Celery optionnel, intégration Stripe.
- **Frontend** : dashboard tenant + super-admin, éditeur visuel de blocs (type Gutenberg/Elementor), SSR/SPA.
- **Infra** : tout doit tourner sous **Docker** (Compose ou autre orchestration), reverse proxy (Nginx/Traefik).

Le comparatif ci‑dessous respecte ces contraintes (multi-tenant, REST, éditeur riche, Docker).

---

## 2. État actuel du projet

| Composant | Choix actuel | Problème côté ressources |
|-----------|--------------|---------------------------|
| **Backend** | Django 5 + `runserver` (dev) | runserver = dev uniquement, mono-thread, pas de limite mémoire. |
| **Frontend** | Next.js 14 + `npm run dev` (dev) | Très gourmand : HMR, recompilations à la volée. |
| **DB** | PostgreSQL 15 (alpine) | Déjà léger ; pas de limite mémoire. |
| **Cache** | Redis 7 (alpine) | Léger ; pas de plafond mémoire. |
| **Orchestration** | Docker Compose | Aucune limite CPU/RAM par service. |

En **production** le projet utilise Gunicorn (Django) et `next build` + `next start` (voir `docker-compose.prod.yml` et **section 8**).

---

## 3. Comparatif Backend (langages et frameworks)

Critères : **RAM typique par instance**, **CPU**, **adéquation au projet** (multi-tenant, ORM, admin, écosystème), **complexité** (migration depuis Django = réécriture).

| Langage / runtime | Framework / stack | RAM typique (prod) | CPU | Multi-tenant / ORM / Admin | Complexité migration | Moins coûteux ? |
|-------------------|-------------------|--------------------|-----|----------------------------|----------------------|-----------------|
| **Python** | **Django** (actuel) | ~80–120 MB/worker (Gunicorn) | 1 cœur/worker | ✅ Schémas PG, ORM, admin intégré | — | Bon compromis |
| **Python** | FastAPI + SQLAlchemy | ~60–100 MB/worker | 1 cœur/worker | ⚠️ À coder (pas de schémas PG natifs) | Très élevée | Légèrement mieux RAM |
| **Python** | Flask + SQLAlchemy | ~50–90 MB/worker | 1 cœur/worker | ⚠️ Tout à coder | Très élevée | Légèrement mieux RAM |
| **Node.js** | Express / Fastify | ~40–80 MB/process | 1 process | ⚠️ Multi-tenant et admin à refaire | Très élevée | Moins de RAM qu’un worker Django |
| **Node.js** | NestJS | ~80–150 MB/process | 1 process | ⚠️ Écosystème différent | Très élevée | Similaire à Django |
| **Go** | Gin / Echo / Fiber | ~15–35 MB/process | Faible | ⚠️ Pas d’ORM/admin équivalent Django | Très élevée | **Très peu de RAM** |
| **Rust** | Actix / Axum | ~10–25 MB/process | Très faible | ⚠️ Écosystème jeune pour CMS/CRM | Très élevée | **Minimum RAM** |
| **C / C++** | Custom HTTP (ex. libcurl + serveur) | ~5–20 MB | Très faible | ❌ Inadapté (pas d’écosystème CMS/CRM) | Réécriture totale | Minimal mais irréaliste |
| **Java / Kotlin** | Spring Boot | ~150–300 MB/JVM | Moyen | ✅ Possible (multi-tenant, ORM) | Très élevée | Plus lourd que Django |
| **C#** | ASP.NET Core | ~80–150 MB/process | Moyen | ✅ Possible | Très élevée | Proche Django |

**Recommandation pour ce projet**  
- **Garder Django** : seul stack avec django-tenants (schémas PostgreSQL), admin, ORM et écosystème déjà en place.  
- Pour **minimiser le coût** sans changer de langage : **Gunicorn** avec **1 ou 2 workers** (variable `GUNICORN_WORKERS`), et **limites mémoire** sur le conteneur (ex. 768 M en prod).  
- **Go / Rust / Node** seraient plus légers en RAM mais imposeraient une **réécriture complète** (multi-tenant, billing, plugins, admin). Le comparatif sert pour une éventuelle refonte future, pas pour un simple tuning.

---

## 4. Comparatif Frontend (frameworks et runtimes)

Critères : **RAM en dev**, **RAM en prod** (build servi), **adéquation** (SSR, auth, API, éditeur riche), **Docker**.

| Techno | RAM dev typique | RAM prod typique | SSR / API / Auth | Complexité migration | Moins coûteux ? |
|--------|------------------|-------------------|-------------------|------------------------|-----------------|
| **Next.js** (actuel) | ~400–800 MB | ~150–250 MB (next start) | ✅ Oui | — | Bon compromis |
| **React** (CRA / Vite) SPA | ~300–600 MB (dev) | 0 si export statique (Nginx) | ❌ Pas de SSR natif | Élevée | Prod très léger si tout statique (pas notre cas) |
| **Remix** (React) | ~350–700 MB (dev) | ~120–200 MB (Node) | ✅ Oui | Élevée | Proche Next.js |
| **Vue 3** (Vite) SPA | ~250–500 MB (dev) | 0 (statique) ou ~100–180 MB (Node) | Selon setup | Élevée | Similaire |
| **Nuxt** (Vue) | ~400–750 MB (dev) | ~130–220 MB (Node) | ✅ Oui | Élevée | Proche Next.js |
| **SvelteKit** | ~200–450 MB (dev) | ~80–150 MB (Node) | ✅ Oui | Élevée | **Un peu moins de RAM** en prod |
| **Angular** | ~500–900 MB (dev) | ~150–280 MB (Node) | ✅ Oui | Très élevée | Plus lourd |
| **Astro** (sites contenu) | ~200–400 MB (dev) | 0 (statique) ou peu (islands) | Partiel | Élevée | Léger si peu d’interactivité (pas adapté à un dashboard complet) |

**Recommandation pour ce projet**  
- **Garder Next.js** : SSR, API routes optionnelles, écosystème React (éditeur de blocs, formulaires) déjà en place.  
- Pour **minimiser le coût** : en prod **next build** + **next start** (jamais `npm run dev`), avec **limite mémoire** (ex. 512 M).  
- **SvelteKit** serait un peu plus léger en prod mais nécessiterait une réécriture complète du front. Le comparatif sert pour une refonte future.

---

## 5. Comparatif Bases de données

Critères : **RAM typique**, **support multi-tenant** (schémas vs base par tenant), **adéquation** avec django-tenants et l’architecture actuelle.

| Base de données | RAM typique (petit déploiement) | Multi-tenant (schémas) | django-tenants | Docker | Moins coûteux ? |
|-----------------|----------------------------------|------------------------|----------------|--------|------------------|
| **PostgreSQL** (actuel) | ~50–256 MB (alpine) | ✅ Schémas natifs | ✅ Support officiel | ✅ Image alpine | **Recommandé** |
| **MySQL** | ~50–200 MB (alpine) | ⚠️ Par base (pas schémas comme PG) | ❌ Non compatible django-tenants | ✅ | Possible mais réécriture multi-tenant |
| **MariaDB** | ~50–200 MB (alpine) | Idem MySQL | ❌ Idem | ✅ | Idem MySQL |
| **SQLite** | ~5–20 MB | ❌ 1 fichier par tenant possible mais pas scalable | ❌ Pas adapté django-tenants prod | ✅ | Minimal RAM mais **inadapté** (concurrence, multi-tenant) |

**Recommandation**  
- **Garder PostgreSQL** : schémas par tenant = modèle actuel (ARCHITECTURE.md), django-tenants, isolation et évolutivité.  
- Pour **minimiser le coût** : image **postgres:15-alpine**, **limite mémoire** sur le conteneur (ex. 512 M en prod), et optionnellement `shared_buffers` modéré dans une config dédiée.

---

## 6. Comparatif Cache / session

| Solution | RAM typique | Utilisation projet | Docker | Moins coûteux ? |
|----------|-------------|--------------------|--------|------------------|
| **Redis** (actuel) | ~10–30 MB (vide) ; plafonné avec maxmemory | Cache, sessions, Celery broker | ✅ redis:7-alpine | **Recommandé** avec maxmemory |
| **Memcached** | ~10–25 MB (vide) | Cache simple uniquement | ✅ | Légèrement moins de features (pas broker Celery) |
| **Pas de cache** (tout en DB) | 0 | Plus de charge DB | — | Économise un conteneur mais dégrade perfs |

**Recommandation**  
- **Garder Redis** : sessions, cache, et broker Celery si utilisé. En prod : **maxmemory 64mb** (ou 128mb) + **maxmemory-policy allkeys-lru** et **limite mémoire** conteneur (ex. 128 M).

---

## 7. Comparatif Orchestration / déploiement (Docker)

Tout doit passer par **Docker** (conteneurisation). Comparatif sur l’**orchestration** et l’**overhead** ressources.

| Option | Overhead RAM/CPU | Complexité | Adapté à la taille projet (VPS 4 CPU / 8 GB) | Moins coûteux ? |
|--------|-------------------|------------|-----------------------------------------------|------------------|
| **Docker Compose** (actuel) | Faible | Simple | ✅ Très adapté | **Recommandé** |
| **Docker Swarm** | Faible à moyen | Moyenne | ✅ Possible | Proche Compose |
| **Kubernetes** (K3s, minikube, etc.) | Élevé (control plane + etcd) | Élevée | ⚠️ Overkill pour un seul VPS | Moins adapté “moins coûteux” |
| **Podman + Podman Compose** | Similaire à Docker | Simple | ✅ Possible | Alternative sans daemon Docker |

**Recommandation**  
- **Garder Docker Compose** : pas d’overhead inutile, cohérent avec **INSTALLATION.md** et **COUTS_PROJET.md** (VPS 4 CPU / 8 GB).  
- Ajouter **deploy.resources.limits** (mémoire, optionnellement CPU) sur chaque service pour maîtriser le coût (déjà en place dans `docker-compose.prod.yml`).

---

## 8. Synthèse : options les moins coûteuses en ressources

Sans réécriture du projet (architecture et objectifs inchangés) :

| Couche | Choix le moins coûteux raisonnable | Déjà en place / à faire |
|--------|-------------------------------------|---------------------------|
| **Backend** | Gunicorn + `config.core.wsgi`, **1 ou 2 workers** | ✅ Dockerfile.prod + `GUNICORN_WORKERS` |
| **Frontend** | **next build** + **next start** (pas dev en prod) | ✅ docker-compose.prod.yml |
| **DB** | **postgres:15-alpine** + limite mémoire | ✅ + limites dans prod |
| **Cache** | **redis:7-alpine** + **maxmemory** | ✅ command Redis en prod |
| **Orchestration** | **Docker Compose** + limites par service | ✅ deploy.resources en prod (et dev optionnel) |

Si on envisage une **refonte complète** (hors scope actuel) :

- **Backend** le plus léger : **Go** (Gin/Fiber) ou **Rust** (Axum) — au prix d’une réécriture (multi-tenant, billing, admin).  
- **Frontend** le plus léger en prod : **SvelteKit** ou SPA statique — au prix d’une réécriture.  
- **DB** : PostgreSQL reste le plus adapté (schémas multi-tenant).  
- **Orchestration** : Docker Compose reste le moins coûteux pour un petit nombre de services.

---

## 9. Références dans la doc

- **docs/ARCHITECTURE.md** : stack actuel, production (Gunicorn, Next build+start), Docker.  
- **docs/INSTALLATION.md** : démarrage avec Docker Compose, prod avec `docker-compose.prod.yml`.  
- **docs/project/COUTS_PROJET.md** : VPS 4 CPU / 8 GB RAM — les limites appliquées en prod tiennent dans cette enveloppe.  
- **docs/architecture/ARCHITECTURE_BLOCKS.md**, **docs/PLUGINS_ARCHITECTURE.md** : contraintes fonctionnelles (éditeur blocs, plugins) conservées quel que soit le choix de stack.

---

## 10. Fichiers concernés (résumé)

- **docker-compose.prod.yml** : Gunicorn (`config.core.wsgi`), `GUNICORN_WORKERS`, limites mémoire, Redis `maxmemory`.  
- **docker-compose.yml** (dev) : limites optionnelles (backend 1 G, frontend 1,5 G) pour éviter qu’un conteneur sature la machine.  
- **backend-django/Dockerfile.prod** : CMD Gunicorn avec `config.core.wsgi` et workers configurables.  
- **docs/ARCHITECTURE.md** : renvoi vers ce comparatif pour les options technologiques complètes.

Ce document couvre l’ensemble des options (langages backend, frameworks frontend, bases de données, cache, orchestration) pour un déploiement **Docker** et une cible **moins coûteuse en ressources**, tout en restant aligné avec l’architecture visée décrite dans les `.md` du projet.
