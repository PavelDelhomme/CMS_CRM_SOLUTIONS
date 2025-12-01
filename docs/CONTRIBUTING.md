# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer à CMS_CRM_SOLUTIONS !

## Comment Contribuer

### 1. Fork et Clone

```bash
git clone https://github.com/VOTRE_USERNAME/CMS_CRM_SOLUTIONS.git
cd CMS_CRM_SOLUTIONS
```

### 2. Créer une Branche

```bash
git checkout -b feature/ma-fonctionnalite
```

### 3. Développer

- Suivez les conventions de code
- Ajoutez des tests
- Documentez votre code
- Vérifiez que les tests passent

### 4. Commit

```bash
git add .
git commit -m "feat: ajout de ma fonctionnalité"
```

Conventions de commit :
- `feat:` : Nouvelle fonctionnalité
- `fix:` : Correction de bug
- `docs:` : Documentation
- `style:` : Formatage
- `refactor:` : Refactorisation
- `test:` : Tests
- `chore:` : Tâches diverses

### 5. Push et Pull Request

```bash
git push origin feature/ma-fonctionnalite
```

Créez une Pull Request sur GitHub.

## Standards de Code

### Python (Backend)

- Utilisez `black` pour le formatage
- Respectez PEP 8
- Maximum 127 caractères par ligne
- Docstrings pour les fonctions et classes

```bash
cd backend-django
make format
make lint
```

### TypeScript (Frontend)

- Utilisez TypeScript strict
- Suivez les règles ESLint
- Composants fonctionnels avec hooks

```bash
cd frontend
npm run lint
npm run type-check
```

## Tests

### Backend

```bash
cd backend-django
make test
```

### Frontend

```bash
cd frontend
npm test
```

## Documentation

- Mettez à jour la documentation si nécessaire
- Ajoutez des commentaires pour le code complexe
- Documentez les nouvelles fonctionnalités

## Questions ?

Ouvrez une issue sur GitHub pour toute question.

