# 🔌 Documentation API

## Base URL

```
http://localhost:9495/api
```

## Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Obtenir un token

```http
POST /api/auth/token/
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

Réponse :

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Utiliser le token

Inclure le token dans les en-têtes :

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Rafraîchir le token

```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## Endpoints

### Pages

#### Lister les pages

```http
GET /api/pages/
Authorization: Bearer <token>
```

#### Récupérer une page

```http
GET /api/pages/{id}/
Authorization: Bearer <token>
```

#### Créer une page

```http
POST /api/pages/
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Ma Page",
  "slug": "ma-page",
  "content": "Contenu de la page",
  "is_published": true
}
```

#### Modifier une page

```http
PUT /api/pages/{id}/
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Ma Page Modifiée",
  "content": "Nouveau contenu"
}
```

#### Supprimer une page

```http
DELETE /api/pages/{id}/
Authorization: Bearer <token>
```

## Documentation Interactive

Accédez à la documentation interactive Swagger :

```
http://localhost:9495/api/docs/
```

Ou ReDoc :

```
http://localhost:9495/api/redoc/
```

## Codes de Statut

- `200 OK` : Requête réussie
- `201 Created` : Ressource créée
- `400 Bad Request` : Requête invalide
- `401 Unauthorized` : Non authentifié
- `403 Forbidden` : Non autorisé
- `404 Not Found` : Ressource non trouvée
- `500 Internal Server Error` : Erreur serveur

## Pagination

Les listes sont paginées par défaut (20 éléments par page) :

```json
{
  "count": 100,
  "next": "http://localhost:9495/api/pages/?page=2",
  "previous": null,
  "results": [...]
}
```

## Filtrage

Utilisez les paramètres de requête pour filtrer :

```http
GET /api/pages/?is_published=true&ordering=-created_at
```

## Recherche

```http
GET /api/pages/?search=terme
```

