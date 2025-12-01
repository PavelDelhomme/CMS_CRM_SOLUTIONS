# Architecture du Système de Blocs Modulaires (Page Builder)

## Vue d'ensemble

Le système de blocs permet aux tenants de construire leurs pages de manière visuelle avec des blocs modulaires, similaires à Gutenberg (WordPress) ou Elementor.

## Structure des Blocs

Chaque bloc est un objet JSON stocké dans le champ `blocks` de la table `pages` :

```json
{
  "id": "unique-block-id",
  "type": "text|image|video|button|link|code|gallery|columns|spacer|divider",
  "data": {
    // Données spécifiques au type de bloc
  },
  "styles": {
    // Styles personnalisés pour ce bloc
    "padding": "20px",
    "margin": "10px",
    "backgroundColor": "#ffffff",
    "textAlign": "center"
  },
  "settings": {
    // Paramètres du bloc
    "width": "full|half|third|quarter",
    "alignment": "left|center|right"
  },
  "order": 0
}
```

## Types de Blocs Disponibles

### 1. **Bloc Texte** (`text`)
- Titre (H1-H6)
- Paragraphe
- Liste (ordonnée/non ordonnée)
- Texte enrichi (gras, italique, souligné)
- Liens intégrés

```json
{
  "type": "text",
  "data": {
    "content": "<h1>Titre</h1><p>Contenu...</p>",
    "richText": true
  }
}
```

### 2. **Bloc Image** (`image`)
- Upload d'image
- Légende
- Alt text
- Liens (optionnel)
- Taille et alignement

```json
{
  "type": "image",
  "data": {
    "url": "/media/image.jpg",
    "alt": "Description",
    "caption": "Légende",
    "link": "https://example.com",
    "width": "100%",
    "height": "auto"
  }
}
```

### 3. **Bloc Vidéo** (`video`)
- YouTube (embed)
- Vimeo (embed)
- Vidéo locale uploadée
- Autoplay, loop, controls

```json
{
  "type": "video",
  "data": {
    "source": "youtube|vimeo|upload",
    "url": "https://youtube.com/watch?v=...",
    "videoId": "abc123",
    "autoplay": false,
    "loop": false,
    "controls": true,
    "thumbnail": "/media/video-thumb.jpg"
  }
}
```

### 4. **Bloc Bouton** (`button`)
- Texte du bouton
- Lien/URL
- Style (primaire, secondaire, etc.)
- Taille
- Icône (optionnel)

```json
{
  "type": "button",
  "data": {
    "text": "Cliquez ici",
    "url": "https://example.com",
    "style": "primary|secondary|outline|ghost",
    "size": "sm|md|lg",
    "icon": "arrow-right",
    "openInNewTab": true
  }
}
```

### 5. **Bloc Lien** (`link`)
- Texte du lien
- URL
- Style personnalisé
- Icône

```json
{
  "type": "link",
  "data": {
    "text": "En savoir plus",
    "url": "https://example.com",
    "openInNewTab": true,
    "icon": "external-link"
  }
}
```

### 6. **Bloc Code** (`code`)
- Code HTML personnalisé
- Code CSS personnalisé
- Code JavaScript (optionnel)
- Prévisualisation

```json
{
  "type": "code",
  "data": {
    "html": "<div>...</div>",
    "css": ".custom { ... }",
    "javascript": "console.log('...')",
    "language": "html|css|javascript"
  }
}
```

### 7. **Bloc Galerie** (`gallery`)
- Multiple images
- Layout (grid, carousel, masonry)
- Légendes
- Lightbox

```json
{
  "type": "gallery",
  "data": {
    "images": [
      {"url": "/media/img1.jpg", "caption": "Image 1"},
      {"url": "/media/img2.jpg", "caption": "Image 2"}
    ],
    "layout": "grid|carousel|masonry",
    "columns": 3,
    "spacing": "10px"
  }
}
```

### 8. **Bloc Colonnes** (`columns`)
- 2, 3, 4 colonnes
- Blocs imbriqués dans chaque colonne
- Responsive

```json
{
  "type": "columns",
  "data": {
    "columns": 3,
    "layout": "equal|custom",
    "columnWidths": ["33%", "33%", "34%"],
    "blocks": [
      [/* blocs colonne 1 */],
      [/* blocs colonne 2 */],
      [/* blocs colonne 3 */]
    ]
  }
}
```

### 9. **Bloc Espaceur** (`spacer`)
- Espacement vertical
- Hauteur personnalisable

```json
{
  "type": "spacer",
  "data": {
    "height": "50px"
  }
}
```

### 10. **Bloc Divider** (`divider`)
- Ligne de séparation
- Style (ligne, pointillée, avec texte)

```json
{
  "type": "divider",
  "data": {
    "style": "solid|dashed|dotted|with-text",
    "color": "#cccccc",
    "text": "Section"
  }
}
```

### 11. **Bloc Embed** (`embed`)
- Iframe personnalisé
- Code embed (YouTube, Vimeo, Google Maps, etc.)
- Taille personnalisable

```json
{
  "type": "embed",
  "data": {
    "embedCode": "<iframe>...</iframe>",
    "width": "100%",
    "height": "400px",
    "responsive": true
  }
}
```

## Modèle Backend

### BlockType Model

```python
class BlockType(models.Model):
    """
    Types de blocs disponibles dans le système
    """
    name = models.CharField(max_length=50)  # text, image, video, etc.
    label = models.CharField(max_length=100)  # "Bloc Texte", "Bloc Image"
    icon = models.CharField(max_length=50)  # nom de l'icône
    category = models.CharField(max_length=50)  # content, layout, media, custom
    schema = models.JSONField()  # Schéma de validation des données
    default_styles = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'block_types'
        ordering = ['category', 'order']
```

## API Endpoints

### Backend Django

```
GET    /api/blocks/types/              # Liste des types de blocs disponibles
GET    /api/blocks/types/{id}/         # Détails d'un type de bloc
POST   /api/pages/{id}/blocks/         # Ajouter un bloc à une page
PUT    /api/pages/{id}/blocks/{block_id}/  # Modifier un bloc
DELETE /api/pages/{id}/blocks/{block_id}/  # Supprimer un bloc
POST   /api/pages/{id}/blocks/reorder/ # Réorganiser les blocs
```

## Interface Frontend

### Éditeur de Blocs (Drag & Drop)

L'éditeur de pages utilisera une interface drag & drop pour :
- Ajouter des blocs depuis une palette
- Réorganiser les blocs (drag & drop)
- Éditer les blocs en cliquant dessus
- Supprimer des blocs
- Dupliquer des blocs
- Prévisualiser en temps réel

### Composants Frontend

1. **BlockEditor** : Composant principal de l'éditeur
2. **BlockPalette** : Palette de blocs disponibles
3. **BlockRenderer** : Renderer pour afficher les blocs
4. **BlockEditorPanel** : Panel latéral pour éditer un bloc sélectionné
5. **BlockPreview** : Prévisualisation du bloc

## Styles Personnalisés

Chaque bloc peut avoir :
- Styles inline (dans le bloc)
- Classes CSS personnalisées
- CSS global (dans les settings du tenant)

## Responsive Design

Les blocs s'adaptent automatiquement :
- Mobile : colonnes empilées verticalement
- Tablet : colonnes ajustées
- Desktop : layout complet

## Sécurité

- Validation des données des blocs côté backend
- Sanitization du HTML/CSS/JS
- Restrictions selon le plan du tenant
- Validation des URLs embed

## Planification d'Implémentation

### Phase 1 : Fondations
- [x] Modèle Page avec champ `blocks` (JSONField)
- [ ] Modèle BlockType
- [ ] API endpoints de base
- [ ] Types TypeScript

### Phase 2 : Blocs de Base
- [ ] Bloc Texte
- [ ] Bloc Image
- [ ] Bloc Bouton
- [ ] Bloc Lien

### Phase 3 : Blocs Média
- [ ] Bloc Vidéo (YouTube, Vimeo)
- [ ] Bloc Galerie
- [ ] Bloc Embed

### Phase 4 : Layout
- [ ] Bloc Colonnes
- [ ] Bloc Espaceur
- [ ] Bloc Divider

### Phase 5 : Avancé
- [ ] Bloc Code (HTML/CSS/JS)
- [ ] Styles personnalisés
- [ ] Templates de blocs
- [ ] Blocs réutilisables

### Phase 6 : Éditeur Visuel
- [ ] Interface drag & drop
- [ ] Prévisualisation en temps réel
- [ ] Panel d'édition
- [ ] Mode responsive

## Fichiers à Créer

### Backend
- `backend-django/blocks/models.py` - Modèles BlockType
- `backend-django/blocks/serializers.py` - Serializers pour les blocs
- `backend-django/blocks/views.py` - ViewSets pour les blocs
- `backend-django/blocks/validators.py` - Validateurs de blocs
- `backend-django/blocks/utils.py` - Utilitaires (sanitization, etc.)

### Frontend
- `frontend/src/types/blocks.ts` - Types TypeScript
- `frontend/src/components/blocks/BlockEditor.tsx` - Éditeur principal
- `frontend/src/components/blocks/BlockPalette.tsx` - Palette de blocs
- `frontend/src/components/blocks/BlockRenderer.tsx` - Renderer
- `frontend/src/components/blocks/BlockEditorPanel.tsx` - Panel d'édition
- `frontend/src/components/blocks/types/TextBlock.tsx` - Composant Texte
- `frontend/src/components/blocks/types/ImageBlock.tsx` - Composant Image
- `frontend/src/components/blocks/types/VideoBlock.tsx` - Composant Vidéo
- `frontend/src/components/blocks/types/ButtonBlock.tsx` - Composant Bouton
- `frontend/src/components/blocks/types/CodeBlock.tsx` - Composant Code
- `frontend/src/services/blocks.service.ts` - Service API pour les blocs

