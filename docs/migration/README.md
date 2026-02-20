# Migration Rust + SvelteKit (Strangler fig)

Ce dossier contient la documentation et les livrables des **phases de migration** vers le backend Rust (Axum) et le frontend SvelteKit, sans supprimer l’existant (Django + Next.js) tant que la parité n’est pas validée.

## Contenu

- **[API_DJANGO_REFERENCE.md](API_DJANGO_REFERENCE.md)** : référence des endpoints de l’API Django (bounded contexts, chemins, auth, ordre de migration). À utiliser comme contrat pour le backend Rust.
- **Phase 0** : branche dédiée créée, API documentée, bounded contexts listés, routage Nginx préparé (commenté) pour le futur backend Rust.

## Stratégie

- **Strangler fig** : migration module par module (auth → tenants → pages → …).
- **Routage** : Nginx peut envoyer un préfixe (ex. `/api/auth/`) vers le backend Rust et le reste vers Django ; configuration préparée dans `docker/nginx/nginx.conf`.
- Plan détaillé des étapes : **[../STATUS.md](../STATUS.md)**. (section « MIGRATION RUST + SVELTEKIT »).

## Références

- **docs/MIGRATION_STACK.md** : choix retenus (Rust, SvelteKit, PostgreSQL, Redis, Docker Compose, Option C).
- **docs/ARCHITECTURE.md** : cible de migration.
- **docs/PERFORMANCE_OPTIONS.md** : comparatif options et RAM.
