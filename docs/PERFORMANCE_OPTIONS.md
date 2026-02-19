# ⚡ Options de performance et coût en ressources

Ce document compare les choix possibles pour **minimiser l’usage CPU/RAM** et le coût d’exécution des conteneurs (dev et prod), en s’appuyant sur la doc existante (`ARCHITECTURE.md`, `INSTALLATION.md`, `COUTS_PROJET.md`).

---

## 1. État actuel (ce qui est utilisé)

| Composant | Actuel | Problème côté ressources |
|-----------|--------|---------------------------|
| **Backend** | `python manage.py runserver` (docker-compose.yml) | Serveur de dev, **mono-thread**, pas pour la prod, pas de limite mémoire. |
| **Frontend** | `npm run dev` (Next.js dev) | **Très coûteux** : HMR, pas de minification, Node + compilations à la volée. |
| **DB** | `postgres:15-alpine` | Déjà léger (alpine). Aucune limite mémoire → peut tout prendre. |
| **Redis** | `redis:7-alpine` | Déjà léger. Aucune limite → peut grossir. |
| **Nginx** | `nginx:alpine` | Léger. OK. |
| **Docker** | Aucune limite CPU/RAM | Un conteneur peut saturer la machine. |

**Conclusion** : la config actuelle **n’est pas** la moins coûteuse en ressources. En dev on privilégie le confort (hot reload), en prod il faut utiliser les bons binaires et limiter les ressources.

---

## 2. Comparatif des options par composant

### 2.1 Backend (API Django)

| Option | RAM typique | CPU | Complexité | Usage recommandé |
|--------|-------------|-----|------------|-------------------|
| **runserver** | ~150–300 MB | 1 cœur | Très simple | **Dev uniquement** (déjà en place). |
| **Gunicorn (workers sync)** | ~80–120 MB/worker | 1 cœur/worker | Simple | **Prod standard** : bon compromis. |
| **Gunicorn (1 worker)** | ~80–120 MB | 1 cœur | Simple | **Prod minimal** : moins de concurrence, coût minimal. |
| **Gunicorn + gevent** | ~100–150 MB/worker | partagé | Moyen | Plus de requêtes/worker, un peu plus complexe. |
| **Uvicorn (ASGI)** | ~90–130 MB/worker | 1 cœur/worker | Moyen | Si on passe Django en ASGI (davantage de changements). |
| **FastAPI à la place** | Moins que Django | Moins | Très élevée | Réécriture complète : **non recommandé** pour ce projet. |

**Recommandation pour la prod (moins coûteux)**  
- **Gunicorn** avec **1 worker** si la charge est faible (coût minimal).  
- **2 workers** dès qu’il y a un peu de concurrence.  
- **4 workers** (comme dans `docker-compose.prod.yml`) pour un petit serveur partagé.  
- Utiliser **toujours** `config.core.wsgi` (et non `core.wsgi`) pour ce projet.

---

### 2.2 Frontend (Next.js)

| Option | RAM typique | CPU | Complexité | Usage recommandé |
|--------|-------------|-----|------------|-------------------|
| **next dev** | ~400–800 MB | Élevé (HMR, recompilations) | Simple | **Dev uniquement** (déjà en place). |
| **next build + next start** | ~150–250 MB | Faible | Simple | **Prod** : une seule instance Node qui sert le build. |
| **next build + export statique** | 0 (servi par Nginx) | 0 (pas de Node) | Élevée | Impossible ici sans perte de fonctionnalités (auth, API, SSR). |
| **Vite + build + nginx** | 0 (statique) | 0 | Très élevée | Réécriture front : **hors scope** pour “minimal sans tout casser”. |

**Recommandation pour la prod (moins coûteux)**  
- **next build** puis **next start** (déjà prévu dans `Dockerfile.prod` et `docker-compose.prod.yml`).  
- Ne **jamais** utiliser `npm run dev` en prod.

---

### 2.3 Base de données (PostgreSQL)

| Option | RAM typique | CPU | Complexité | Usage recommandé |
|--------|-------------|-----|------------|-------------------|
| **postgres:15-alpine** | ~50–100 MB (vide) à 256 MB+ | Faible | Simple | **Déjà le bon choix** (image légère). |
| **postgres:15** (non alpine) | Plus lourd | Idem | Simple | Moins bon pour “minimal”. |
| **Limites + shared_buffers** | Capped (ex. 256 MB) | Capped | Moyen | **Recommandé** en prod pour ne pas déborder. |

**Recommandation**  
- Garder **postgres:15-alpine**.  
- En prod, ajouter des **limites mémoire** côté Docker et, si besoin, un `shared_buffers` modéré dans une config Postgres dédiée (ex. 128–256 MB sur un petit VPS).

---

### 2.4 Redis

| Option | RAM typique | CPU | Complexité | Usage recommandé |
|--------|-------------|-----|------------|-------------------|
| **redis:7-alpine** | ~10–30 MB (vide) | Très faible | Simple | **Déjà le bon choix**. |
| **redis + maxmemory** | Plafonné (ex. 64 MB) | Idem | Simple | **Recommandé** en prod pour éviter la pousse mémoire. |

**Recommandation**  
- Garder **redis:7-alpine**.  
- En prod, définir **maxmemory** (ex. 64m ou 128m) et une politique **maxmemory-policy** (ex. `allkeys-lru`).

---

### 2.5 Conteneurs Docker (limites globales)

| Option | Effet | Complexité |
|--------|--------|------------|
| **Aucune limite** (actuel) | Un service peut consommer toute la RAM/CPU | Aucune |
| **deploy.resources.limits** (mémoire + CPU) | Plafond par service, évite les saturations | Faible |
| **deploy.resources.reservations** | Réserve minimale (optionnel) | Faible |

**Recommandation**  
- En **prod** (et optionnellement en dev) : définir des **limits** mémoire (et éventuellement CPU) pour chaque service pour que le total soit prévisible et “le moins coûteux” maîtrisé.

---

## 3. Synthèse : ce qui est le moins coûteux en ressources

- **Backend**  
  - Dev : `runserver` (actuel).  
  - Prod : **Gunicorn** avec **config.core.wsgi**, **1 ou 2 workers** pour un coût minimal, 4 workers si la charge augmente.

- **Frontend**  
  - Dev : `npm run dev` (actuel).  
  - Prod : **next build + next start** (pas de `npm run dev`).

- **DB**  
  - **postgres:15-alpine** + limites Docker en prod (+ optionnel `shared_buffers`).

- **Redis**  
  - **redis:7-alpine** + **maxmemory** en prod.

- **Docker**  
  - **Limites mémoire (et optionnellement CPU)** sur tous les services en prod (et éventuellement en dev pour éviter les surprises).

Avec ça, l’utilisation actuelle **n’est pas** la moins coûteuse tant qu’on reste en `runserver` + `next dev` partout ; en revanche, en appliquant les choix ci‑dessus **en production** et en ajoutant les limites, on obtient la configuration **la moins coûteuse en ressources** raisonnable pour ce stack sans réécriture majeure.

---

## 4. Références dans la doc existante

- **docs/ARCHITECTURE.md** : “Production : Gunicorn pour Django” → cohérent avec Gunicorn + `config.core.wsgi`.  
- **docs/INSTALLATION.md** : “Production : docker-compose.prod.yml” → à utiliser avec les corrections ci‑dessus.  
- **docs/project/COUTS_PROJET.md** : VPS 4 CPU / 8 GB RAM → les limites proposées permettent de rester dans ces bornes et d’avoir une marge pour le reste du système.

---

## 5. Fichiers à adapter (résumé)

1. **docker-compose.prod.yml** (et Dockerfile.prod backend)  
   - Commande Gunicorn : utiliser **config.core.wsgi:application** (pas `core.wsgi`).  
   - Rendre le nombre de workers configurable (ex. env `GUNICORN_WORKERS=2`), avec une valeur par défaut faible (1 ou 2) pour le “moins coûteux”.

2. **docker-compose.yml** (optionnel pour dev)  
   - Garder `runserver` et `npm run dev` pour le dev.  
   - Possibilité d’ajouter des **deploy.resources.limits** même en dev pour éviter qu’un conteneur n’accapare toute la machine.

3. **Prod : limites ressources**  
   - Backend : ex. 512 MB–1 GB RAM.  
   - Frontend : ex. 384–512 MB RAM.  
   - DB : ex. 256–512 MB RAM.  
   - Redis : ex. 64–128 MB RAM.  
   - Nginx : ex. 64–128 MB RAM.

4. **Redis**  
   - En prod : option `maxmemory 64mb` (ou 128mb) + `maxmemory-policy allkeys-lru` (via config ou commande du conteneur).

En suivant ces recommandations, tu utilises bien **les options les plus performantes / les moins coûteuses en ressources** pour ce projet, avec un comparatif clair et des changements ciblés (prod + limites) sans tout réécrire.
