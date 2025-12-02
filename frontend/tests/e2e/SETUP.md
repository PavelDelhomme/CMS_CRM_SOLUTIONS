# 🛠️ Installation Playwright sur Manjaro Linux

## Problèmes courants

### 1. "playwright: commande introuvable"

**Solution** : Installer les dépendances npm d'abord
```bash
cd frontend
npm install
```

### 2. Dépendances système manquantes

Sur Manjaro Linux, installer les dépendances avec pacman :

```bash
# Installer les dépendances système
sudo pacman -S \
  libicu \
  libxml2 \
  flite \
  libnss \
  libnspr \
  libatk-bridge \
  libdrm \
  libxkbcommon \
  libxcomposite \
  libxdamage \
  libxfixes \
  libxrandr \
  libgbm \
  libasound2 \
  libatspi \
  libxss \
  libgtk-3 \
  libgdk-pixbuf2
```

Ou utiliser la commande Playwright (si disponible) :
```bash
sudo npx playwright install-deps
```

### 3. Installation des navigateurs

Après avoir installé les dépendances npm et système :
```bash
npx playwright install chromium
# ou pour tous les navigateurs
npx playwright install
```

## Installation complète (étape par étape)

```bash
# 1. Aller dans le dossier frontend
cd frontend

# 2. Installer les dépendances npm
npm install

# 3. Installer les dépendances système (Manjaro)
sudo pacman -S libicu libxml2 libnss libnspr libatk-bridge libdrm \
  libxkbcommon libxcomposite libxdamage libxfixes libxrandr libgbm \
  libasound2 libatspi libxss libgtk-3 libgdk-pixbuf2

# 4. Installer les navigateurs Playwright
npx playwright install chromium

# 5. Tester
npm run test:e2e
```

## Alternative : Utiliser Docker

Si les dépendances système posent problème, vous pouvez exécuter les tests dans Docker :

```bash
# Dans le conteneur frontend
docker-compose exec frontend npm run test:e2e
```

## Vérification

Vérifier que Playwright est bien installé :
```bash
npx playwright --version
```

