# 🛠️ Guide d'Installation Complet - VTCBuilder

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation Automatique](#installation-automatique)
3. [Installation Manuelle](#installation-manuelle)
4. [Configuration](#configuration)
5. [Vérification](#vérification)
6. [Dépannage](#dépannage)

---

## 📋 Prérequis

### Systèmes d'Exploitation Supportés

- ✅ Linux (Ubuntu, Debian, Arch, Manjaro, etc.)
- ✅ macOS
- ✅ Windows (avec WSL2)

### Logiciels Requis

#### Docker & Docker Compose

**Linux (Ubuntu/Debian):**
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Arch/Manjaro:**
```bash
sudo pacman -S docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

**macOS:**
```bash
# Installer Docker Desktop depuis https://www.docker.com/products/docker-desktop
# ou avec Homebrew
brew install --cask docker
```

**Windows:**
- Installer WSL2
- Installer Docker Desktop pour Windows

#### Make (Optionnel mais recommandé)

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install make

# Arch/Manjaro
sudo pacman -S make
```

**macOS:**
```bash
xcode-select --install
```

### Vérification des Prérequis

```bash
# Vérifier Docker
docker --version
# Doit afficher : Docker version 20.10+ ou supérieur

# Vérifier Docker Compose
docker-compose --version
# Doit afficher : Docker Compose version 2.0+ ou supérieur

# Vérifier Make
make --version
# Doit afficher : GNU Make 4.0+ ou supérieur

# Vérifier que Docker fonctionne
docker run hello-world
```

---

## 🚀 Installation Automatique

### Méthode 1 : Script de Démarrage (Recommandé)

```bash
cd /home/pactivisme/Documents/Dev/Perso/VTCBuilder
./start.sh
```

Le script vous guidera à travers :
1. ✅ Vérification des prérequis
2. ✅ Création du fichier `.env`
3. ✅ Construction des images Docker
4. ✅ Démarrage des services
5. ✅ Installation des dépendances
6. ✅ Migrations de base de données
7. ✅ Insertion des données de test

### Méthode 2 : Make Setup

```bash
cd /home/pactivisme/Documents/Dev/Perso/VTCBuilder
make setup
```

Cette commande effectue une installation complète en une seule fois.

---

## 🔧 Installation Manuelle

Si vous préférez contrôler chaque étape :

### Étape 1 : Cloner/Naviguer vers le Projet

```bash
cd /home/pactivisme/Documents/Dev/Perso/VTCBuilder
```

### Étape 2 : Créer le Fichier d'Environment

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer si nécessaire
nano .env
```

### Étape 3 : Construire les Images Docker

```bash
docker-compose build
# ou
make build
```

### Étape 4 : Démarrer les Services

```bash
docker-compose up -d
# ou
make start
```

### Étape 5 : Attendre que MySQL Soit Prêt

```bash
# Vérifier les logs
docker-compose logs -f mysql

# Attendre le message "ready for connections"
```

### Étape 6 : Installer les Dépendances Backend

```bash
docker exec vtcbuilder_backend composer install --no-interaction --optimize-autoloader
# ou
make composer-install
```

### Étape 7 : Générer la Clé d'Application

```bash
docker exec vtcbuilder_backend php artisan key:generate
# ou
make key-generate
```

### Étape 8 : Exécuter les Migrations

```bash
docker exec vtcbuilder_backend php artisan migrate --force
# ou
make migrate
```

### Étape 9 : Insérer les Données de Test

```bash
docker exec vtcbuilder_backend php artisan db:seed
# ou
make seed
```

### Étape 10 : Installer les Dépendances Frontend

```bash
docker exec vtcbuilder_frontend npm install
# ou
make npm-install
```

---

## ⚙️ Configuration

### Configuration de Base

Le fichier `.env` contient toutes les configurations importantes :

```env
# Application
APP_NAME="CMS CRM Solutions"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:3000

# Base de données
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=vtcbuilder
DB_USERNAME=vtcbuilder_user
DB_PASSWORD=vtcbuilder_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Multi-tenant
CENTRAL_DOMAINS=localhost,127.0.0.1
```

### Configuration Avancée

#### Changer le Port du Frontend

Dans `docker-compose.yml` :
```yaml
frontend:
  ports:
    - "3001:3000"  # Changer 3000 en 3001
```

#### Changer le Port du Backend

Dans `docker-compose.yml` :
```yaml
nginx:
  ports:
    - "8001:80"  # Changer 8000 en 8001
```

#### Activer SSL/HTTPS

Configuration de Traefik dans `docker-compose.yml` :
```yaml
traefik:
  command:
    - "--certificatesresolvers.letsencrypt.acme.email=votre@email.com"
    - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
```

---

## ✅ Vérification

### 1. Vérifier que Tous les Services Sont Actifs

```bash
docker-compose ps
# ou
make status
```

Vous devriez voir :
- ✅ vtcbuilder_backend (running)
- ✅ vtcbuilder_frontend (running)
- ✅ vtcbuilder_mysql (running/healthy)
- ✅ cms_nginx (running)
- ✅ cms_redis (running)
- ✅ cms_traefik (running)
- ✅ cms_phpmyadmin (running)

### 2. Tester les URLs

Ouvrez dans votre navigateur :

- **Frontend**: http://localhost:3000
  - Devrait afficher la page d'accueil

- **Backend API**: http://localhost:8000
  - Devrait afficher une réponse JSON

- **PhpMyAdmin**: http://localhost:8081
  - Login : vtcbuilder_user / vtcbuilder_password

- **Traefik Dashboard**: http://localhost:8080

### 3. Vérifier les Logs

```bash
# Tous les logs
make logs

# Logs spécifiques
make logs-backend
make logs-frontend
make logs-db
```

### 4. Tester la Connexion à la Base de Données

```bash
make db-cli
# ou
docker exec -it vtcbuilder_mysql mysql -u vtcbuilder_user -pvtcbuilder_password vtcbuilder

# Dans MySQL
SHOW TABLES;
SELECT * FROM users LIMIT 1;
exit;
```

### 5. Vérifier les Comptes

**Super Admin:**
- URL: http://localhost:3000/admin
- Email: admin@example.com
- Password: admin123

**Client Demo:**
- URL: http://localhost:3000/client
- Email: client@example.com
- Password: client123

---

## 🚨 Dépannage

### Problème 1 : Les Containers ne Démarrent Pas

**Solution:**
```bash
# Nettoyer et redémarrer
make clean
make install
make start
```

### Problème 2 : Erreur "Port Already in Use"

**Solution:**
```bash
# Trouver le processus utilisant le port
sudo lsof -i :3000  # Pour le frontend
sudo lsof -i :8000  # Pour le backend

# Tuer le processus
sudo kill -9 <PID>

# Ou changer le port dans docker-compose.yml
```

### Problème 3 : MySQL Ne Démarre Pas

**Solution:**
```bash
# Voir les logs MySQL
make logs-db

# Si corruption de données
docker-compose down -v  # ⚠️ Supprime les données !
docker-compose up -d
make migrate seed
```

### Problème 4 : Erreur de Permissions

**Solution:**
```bash
# Corriger les permissions
make fix-permissions

# Ou manuellement
sudo chown -R $USER:$USER .
chmod -R 755 backend/storage backend/bootstrap/cache
```

### Problème 5 : Composer Install Échoue

**Solution:**
```bash
# Vider le cache Composer
docker exec vtcbuilder_backend composer clear-cache
docker exec vtcbuilder_backend composer install --no-cache
```

### Problème 6 : Migration Échoue

**Solution:**
```bash
# Reset complet de la base
make db-reset

# Ou manuellement
make db-cli
# Dans MySQL :
DROP DATABASE vtcbuilder;
CREATE DATABASE vtcbuilder;
exit;

make migrate
```

### Problème 7 : Frontend Ne Se Connecte Pas au Backend

**Solution:**
```bash
# Vérifier les variables d'environnement
docker exec vtcbuilder_frontend env | grep API

# Devrait afficher : NEXT_PUBLIC_API_URL=http://api.localhost

# Reconstruire si nécessaire
make rebuild
```

### Problème 8 : Espace Disque Insuffisant

**Solution:**
```bash
# Nettoyer Docker
docker system prune -a --volumes

# Ou utiliser Make
make clean-all
```

---

## 📊 Ressources Système Recommandées

### Minimum

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disque**: 10 GB libres

### Recommandé

- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Disque**: 20+ GB libres

### Pour Production

- **CPU**: 8+ cores
- **RAM**: 16+ GB
- **Disque**: 100+ GB (SSD)

---

## 🔄 Mise à Jour

Pour mettre à jour le projet :

```bash
# Arrêter les services
make stop

# Mettre à jour le code (si Git)
git pull

# Reconstruire
make rebuild

# Migrer si nécessaire
make migrate
```

---

## 📝 Prochaines Étapes

Après l'installation :

1. ✅ Lire le [QUICKSTART.md](./QUICKSTART.md)
2. ✅ Consulter les [COMMANDES.md](./COMMANDES.md)
3. ✅ Lire le [README.md](./README.md)
4. ✅ Commencer à développer !

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Consultez la section **Dépannage** ci-dessus
2. Vérifiez les logs : `make logs`
3. Réinitialisez : `make reset`

---

**Installation terminée ! Bon développement ! 🚀**

