# 🎨 Templates VTC - VTCBuilder

## Templates Disponibles

### 1. Modern VTC (Gratuit)
**Dossier:** `modern-vtc/`

**Caractéristiques:**
- Design moderne et épuré
- Couleurs par défaut: Bleu (#3B82F6) / Vert (#10B981)
- Sections: Hero, Services, Pourquoi nous, Tarifs, Contact
- Responsive mobile-first
- Calculateur de prix intégré
- Formulaire de réservation

**Fichiers:**
- `index.html` - Structure HTML avec variables
- `style.css` - Styles CSS avec variables couleurs
- `script.js` - JavaScript (calculateur, formulaires)

### 2. Luxury VTC (Premium - 49€)
**Dossier:** `luxury-vtc/`

**Caractéristiques:**
- Design premium haut de gamme
- Couleurs: Gris foncé / Or
- Hero avec vidéo background
- Galerie de véhicules
- Témoignages clients
- Réservation avancée

**Status:** À créer

### 3. Classic VTC (Gratuit)
**Dossier:** `classic-vtc/`

**Caractéristiques:**
- Design professionnel classique
- Couleurs: Bleu marine / Vert
- Layout traditionnel
- Section "Pourquoi nous choisir"
- Grille de tarifs

**Status:** À créer

### 4. Minimal VTC (Gratuit)
**Dossier:** `minimal-vtc/`

**Caractéristiques:**
- Design minimaliste élégant
- Couleurs: Noir / Gris
- Typographie soignée
- Espaces blancs généreux
- Focus sur l'essentiel

**Status:** À créer

---

## Variables de Template

Chaque template utilise des variables pour la personnalisation :

### Variables Globales
```
{{site_name}}        - Nom du site
{{site_description}} - Description
{{logo_url}}         - URL du logo
{{primary_color}}    - Couleur principale
{{secondary_color}}  - Couleur secondaire
{{phone}}            - Téléphone
{{email}}            - Email
{{address}}          - Adresse
```

### Variables Hero
```
{{hero_title}}       - Titre principal
{{hero_subtitle}}    - Sous-titre
{{hero_image}}       - Image de fond
```

### Variables Services (Loop)
```
{{#each services}}
  {{id}}             - ID du service
  {{name}}           - Nom
  {{description}}    - Description
  {{icon}}           - Icône
  {{image}}          - Image
  {{base_price}}     - Prix de base
  {{price_per_km}}   - Prix/km
  {{max_passengers}} - Passagers max
  {{max_luggage}}    - Bagages max
  {{features}}       - Caractéristiques
{{/each}}
```

---

## Système de Génération

### Processus de Génération

1. **Sélection du template**
   - Le tenant choisit un template
   - Le template est copié dans son espace

2. **Personnalisation**
   - Remplacement des variables
   - Couleurs personnalisées
   - Logo et images

3. **Génération**
   - Compilation HTML/CSS/JS
   - Optimisation des assets
   - Minification

4. **Déploiement**
   - Upload vers le serveur
   - Configuration du subdomain
   - Activation

---

## Comment Utiliser

### Dans le Code Backend

```php
// Charger un template
$template = Template::where('slug', 'modern-vtc')->first();

// Appliquer au tenant
$tenant->templates()->attach($template->id, [
    'customizations' => [
        'primary_color' => '#3B82F6',
        'secondary_color' => '#10B981',
        // ...
    ],
    'is_active' => true,
]);

// Générer le site
$generator = new SiteGenerator($tenant);
$generator->generate();
```

### Dans le Frontend

```typescript
// Appliquer un template
await templateService.apply(templateId);

// Sauvegarder les customisations
await templateService.updateCustomizations(templateId, {
  primary_color: '#3B82F6',
  secondary_color: '#10B981',
  logo: '/uploads/logo.png',
});
```

---

## Structure d'un Template

```
template-name/
├── index.html       - Structure HTML
├── style.css        - Styles CSS
├── script.js        - JavaScript
├── preview.png      - Image de preview
└── config.json      - Configuration
```

### config.json Exemple

```json
{
  "name": "Modern VTC",
  "slug": "modern-vtc",
  "description": "Template moderne et épuré",
  "category": "modern",
  "is_premium": false,
  "variables": [
    "site_name",
    "hero_title",
    "hero_subtitle",
    "primary_color",
    "secondary_color"
  ],
  "sections": [
    "hero",
    "services",
    "features",
    "pricing",
    "contact"
  ]
}
```

---

## Développement de Nouveaux Templates

### 1. Créer le Dossier
```bash
mkdir public-site/templates/mon-template
```

### 2. Créer les Fichiers
- index.html
- style.css
- script.js
- config.json

### 3. Utiliser les Variables
```html
<h1>{{site_name}}</h1>
<div style="color: {{primary_color}}">...</div>
```

### 4. Ajouter en Base de Données
```php
Template::create([
    'name' => 'Mon Template',
    'slug' => 'mon-template',
    'structure' => [
        'header' => [...],
        'sections' => [...],
        'footer' => [...],
    ],
    // ...
]);
```

---

## API de Génération

### Endpoint de Génération
```
POST /api/templates/{id}/apply
PUT  /api/templates/customizations
GET  /api/templates/{id}/preview
```

### Exemple de Customisation

```json
{
  "template_id": 1,
  "customizations": {
    "primary_color": "#3B82F6",
    "secondary_color": "#10B981",
    "font_family": "Inter, sans-serif",
    "logo": "/uploads/logo.png",
    "hero_title": "Votre VTC de Confiance",
    "hero_subtitle": "Service premium à Paris",
    "sections": {
      "hero": { "enabled": true },
      "services": { "enabled": true },
      "contact": { "enabled": true }
    }
  }
}
```

---

**Templates VTCBuilder - Prêts pour la génération automatique de sites VTC ! 🚀**

