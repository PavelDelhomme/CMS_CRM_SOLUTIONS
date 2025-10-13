# 📋 Guide des Commandes - VTCBuilder

## 🚀 Démarrage Rapide

### Option 1 : Script Automatique (Recommandé)
```bash
./start.sh
```

### Option 2 : Avec Make
```bash
make setup
```

### Option 3 : Manuel avec Docker
```bash
docker-compose up -d
```

---

## 📚 Commandes Make Essentielles

### 🔧 Gestion des Services

| Commande | Description |
|----------|-------------|
| `make start` | ▶️ Démarrer tous les services |
| `make stop` | ⏸️ Arrêter tous les services |
| `make restart` | 🔄 Redémarrer tous les services |
| `make status` | 📊 Voir le statut des services |
| `make logs` | 📝 Voir tous les logs en temps réel |

### 📦 Installation et Configuration

| Commande | Description |
|----------|-------------|
| `make install` | 📥 Installation initiale du projet |
| `make setup` | ⚙️ Installation complète avec données de test |
| `make build` | 🔨 Reconstruire les images Docker |
| `make rebuild` | 🔄 Tout reconstruire et redémarrer |

### 💾 Base de Données

| Commande | Description |
|----------|-------------|
| `make migrate` | 🗄️ Exécuter les migrations |
| `make seed` | 🌱 Insérer les données de test |
| `make fresh` | 🆕 Reset DB + migrations + seeders |
| `make db-backup` | 💾 Créer un backup de la DB |
| `make db-reset` | ⚠️ Reset complet de la base |
| `make db-cli` | 🔧 Accéder à MySQL CLI |

### 🔑 Backend (Laravel)

| Commande | Description |
|----------|-------------|
| `make composer-install` | 📦 Installer dépendances Composer |
| `make artisan cmd="..."` | 🎯 Exécuter commande artisan |
| `make migrate` | 📊 Migrations de base de données |
| `make optimize` | ⚡ Optimiser Laravel (cache) |
| `make clear-cache` | 🧹 Nettoyer les caches |
| `make bash-backend` | 💻 Terminal backend |

### 🎨 Frontend (React/Next.js)

| Commande | Description |
|----------|-------------|
| `make npm-install` | 📦 Installer dépendances npm |
| `make npm-build` | 🔨 Build du frontend |
| `make npm cmd="..."` | 🎯 Exécuter commande npm |
| `make bash-frontend` | 💻 Terminal frontend |

### 🏢 Multi-Tenant

| Commande | Description |
|----------|-------------|
| `make tenant-create name="client1"` | ➕ Créer un nouveau tenant |
| `make tenant-list` | 📋 Lister tous les tenants |
| `make tenant-migrate` | 🗄️ Migrer les tenants |
| `make tenant-seed` | 🌱 Seed des tenants |

### 📊 Logs et Debugging

| Commande | Description |
|----------|-------------|
| `make logs` | 📝 Tous les logs |
| `make logs-backend` | 🔧 Logs backend uniquement |
| `make logs-frontend` | 🎨 Logs frontend uniquement |
| `make logs-db` | 🗄️ Logs base de données |

### 🧪 Tests

| Commande | Description |
|----------|-------------|
| `make test` | 🧪 Exécuter les tests |
| `make test-coverage` | 📊 Tests avec couverture |

### 🧹 Nettoyage

| Commande | Description |
|----------|-------------|
| `make clean` | 🧹 Nettoyer containers et volumes |
| `make clean-all` | 🗑️ Nettoyage complet + images |
| `make reset` | 🔄 Reset complet du projet |

### ℹ️ Informations

| Commande | Description |
|----------|-------------|
| `make help` | ❓ Afficher l'aide complète |
| `make urls` | 🌐 Afficher toutes les URLs |
| `make info` | ℹ️ Informations système Docker |

---

## 🎯 Workflows Courants

### 🌅 Démarrer une journée de développement

```bash
make start          # Démarrer les services
make logs           # Suivre les logs
```

### 🔧 Faire des modifications backend

```bash
make bash-backend   # Accéder au container

# Dans le container :
php artisan make:controller MonController
php artisan make:model MonModel -m

# Sortir et migrer
exit
make migrate
make clear-cache
```

### 🎨 Faire des modifications frontend

```bash
make bash-frontend  # Accéder au container

# Dans le container :
# Faire vos modifications...

# Pour installer un package
exit
make npm cmd="install axios"
```

### 🏢 Créer un nouveau client (tenant)

```bash
make tenant-create name="mon-client"
make tenant-migrate
make tenant-seed
```

### 🧪 Lancer les tests

```bash
make test
# ou avec couverture
make test-coverage
```

### 🌙 Fin de journée

```bash
make stop           # Arrêter les services (optionnel)
```

---

## 🚨 Dépannage

### ❌ Les services ne démarrent pas

```bash
make clean
make install
make start
```

### 🔐 Erreur de permissions

```bash
make fix-permissions
```

### 💾 Base de données corrompue

```bash
make db-reset
```

### 🗑️ Problèmes de cache

```bash
make clear-cache
```

### 🔄 Tout réinitialiser

```bash
make reset
```

---

## 💡 Astuces Avancées

### Exécuter une commande artisan personnalisée

```bash
make artisan cmd="route:list"
make artisan cmd="make:controller Api/UserController --api"
make artisan cmd="queue:work"
```

### Exécuter une commande npm personnalisée

```bash
make npm cmd="run lint"
make npm cmd="install --save @tanstack/react-query"
make npm cmd="run type-check"
```

### Créer un backup avant modifications importantes

```bash
make db-backup
# Fichier créé dans ./backups/backup_YYYYMMDD_HHMMSS.sql
```

### Restaurer un backup

```bash
make db-restore file="./backups/backup_20250113_120000.sql"
```

### Accès direct à MySQL

```bash
make db-cli
# ou
docker exec -it vtcbuilder_mysql mysql -u vtcbuilder_user -pvtcbuilder_password vtcbuilder
```

### Voir les containers en cours d'exécution

```bash
make status
# ou
docker-compose ps
```

### Suivre les logs d'un service spécifique

```bash
make logs-backend    # Backend uniquement
make logs-frontend   # Frontend uniquement
make logs-db         # Base de données uniquement
```

---

## 🌐 URLs de l'Application

| Service | URL | Identifiants |
|---------|-----|--------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:8000 | - |
| PhpMyAdmin | http://localhost:8081 | User: vtcbuilder_user<br>Pass: vtcbuilder_password |
| Traefik Dashboard | http://localhost:8080 | - |

### 🔑 Comptes par Défaut

**Super Admin**
- URL: http://localhost:3000/admin
- Email: admin@example.com
- Password: admin123

**Client Demo**
- URL: http://localhost:3000/client
- Email: client@example.com
- Password: client123

---

## 📖 Documentation Complète

- [README.md](./README.md) - Documentation principale
- [QUICKSTART.md](./QUICKSTART.md) - Guide de démarrage rapide
- Documentation API - À venir

---

## ❓ Aide

Pour voir toutes les commandes avec descriptions :

```bash
make help
```

Pour tout problème, consultez la section **Dépannage** ci-dessus.

---

**Bon développement ! 🚀**

