# Tests API - Configuration

## Variables d'environnement

Les tests utilisent des variables d'environnement pour la configuration. Vous pouvez les définir de plusieurs façons :

### 1. Fichier .env (recommandé)

Créez un fichier `.env` à la racine du projet `backend-django/` avec :

```env
# Test Configuration
TEST_API_URL=http://localhost:9495/api
TEST_EMAIL=admin@vtcbuilder.com
TEST_PASSWORD=admin123
```

### 2. Variables d'environnement système

```bash
export TEST_API_URL=http://localhost:9495/api
export TEST_EMAIL=admin@vtcbuilder.com
export TEST_PASSWORD=admin123
```

### 3. Valeurs par défaut

Si les variables ne sont pas définies, les valeurs par défaut suivantes seront utilisées :

- `TEST_API_URL`: `http://localhost:9495/api`
- `TEST_EMAIL`: `admin@vtcbuilder.com`
- `TEST_PASSWORD`: `admin123`

## Exécution des tests

```bash
# Depuis le répertoire backend-django/
python tests/api/test_endpoints.py
```

## Variables disponibles

| Variable | Description | Défaut |
|----------|-------------|--------|
| `TEST_API_URL` | URL de base de l'API à tester | `http://localhost:9495/api` |
| `TEST_EMAIL` | Email de l'utilisateur de test | `admin@vtcbuilder.com` |
| `TEST_PASSWORD` | Mot de passe de l'utilisateur de test | `admin123` |

## Sécurité

⚠️ **Important** : Ne commitez jamais le fichier `.env` contenant des mots de passe réels dans le dépôt Git. Utilisez `.env.example` pour documenter les variables nécessaires.

