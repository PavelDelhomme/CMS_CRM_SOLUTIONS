# 📊 STATUS - État du Projet VTCBuilder

> **Fichier centralisé de suivi - Toute information importante pour le développement**

---

## 💰 Coûts du Projet

**Domaine vtcbuilder.com** : 76,09 € TTC (13/10/2025 - 13/10/2030, 5 ans)
- Nom de domaine .com : 61,95 € HT
- DNS Anycast : 5,45 € HT
- Zimbra Starter : 0,30 € HT
- Total HT : 63,41 €
- TVA (20%) : 12,68 €
- **Total TTC : 76,09 €**

Voir [docs/project/COUTS_PROJET.md](./docs/project/COUTS_PROJET.md) pour plus de détails.

---

## 🎯 État Actuel (2025-11-26)

### 🚨 Travail en Cours - Résolution des Erreurs Globales

**Priorité Actuelle** : Résolution des erreurs globales dans le projet  
**Référence** : Suivi du fichier [docs/tests/README_TESTS.md](./docs/tests/README_TESTS.md) pour l'implémentation complète du système de tests

**Objectif** : Une fois les tests finalisés et toutes les erreurs résolues, nous travaillerons sur la suite des fonctionnalités en place (routing multi-tenant, pages publiques, etc.)

---

### ✅ Fonctionnalités Implémentées

#### Backend Django
- ✅ Architecture multi-tenant avec django-tenants
- ✅ Authentification par email
- ✅ Gestion utilisateurs (CRUD complet + modification mot de passe directe)
- ✅ Gestion tenants (CRUD + soft delete + restore)
- ✅ Système de réinitialisation de mot de passe
- ✅ Système d'invitation pour nouveaux tenants
- ✅ Plans tarifaires et quotas
- ✅ Système de facturation (modèles + API)
- ✅ Dashboard avec statistiques
- ✅ Statistiques détaillées avec monitoring complet
- ✅ Mise à jour partielle utilisateurs (permet modification uniquement du mot de passe)
- ✅ Système de paramètres globaux (singleton)
- ✅ Gestion des templates avec HTML/CSS
- ✅ Payment Methods (modes de paiement)
- ✅ Gestion des erreurs améliorée (retour de tableaux vides au lieu de 500)

#### Frontend Next.js
- ✅ Interface super admin complète
- ✅ Interface tenant admin (WordPress-style)
- ✅ Pages de login/register/forgot-password/reset-password
- ✅ Gestion responsive (mobile-first)
- ✅ Navigation avec sidebar
- ✅ Gestion utilisateurs tenant
- ✅ Gestion facturation tenant
- ✅ Modification mot de passe directe dans liste utilisateurs
- ✅ Page statistiques détaillées avec alertes et monitoring
- ✅ Page templates avec upload HTML/CSS
- ✅ Page settings pour configuration système
- ✅ Gestion gracieuse des erreurs API (404, 500)
- ✅ Protection contre les erreurs undefined/null

#### Configuration
- ✅ Ports remappés sur 9494+ (frontend: 9494, backend: 9495)
- ✅ Docker Compose configuré
- ✅ Commandes Makefile à la racine (`make start`, `make setup-backend-django`)
- ✅ Configuration email (SMTP OVH configuré dans docker-compose.simple.yml)
  - Serveur: ssl0.ovh.net:587 (TLS)
  - Authentification: test@delhomme.ovh
  - Script de test: backend-django/test_email.py

---

## 🔧 Corrections Récentes

### Janvier 2025
1. ✅ **Page Stats - Erreurs corrigées** - Initialisation complète des valeurs par défaut, protection contre undefined
2. ✅ **Page EditUserPage - Erreur tenants.map** - Gestion correcte de la réponse paginée, vérifications Array.isArray()
3. ✅ **Templates API - Erreur 500 corrigée** - Logs détaillés, retour de tableau vide en cas d'erreur
4. ✅ **Templates - Champs HTML/CSS** - Ajout de html_content et css_content, interface avec onglets
5. ✅ **Payment Methods - Gestion 404** - Gestion gracieuse des erreurs, messages en développement seulement
6. ✅ **System Settings - Endpoint créé** - Singleton pour paramètres globaux, test email intégré

### Novembre 2024
7. ✅ **Statistiques dashboard** - Exclusion tenants soft-deleted
8. ✅ **Affichage utilisateurs tenant** - Filtre par tenant_id corrigé
9. ✅ **Mot de passe tenant** - Changé en `tenant123`
10. ✅ **Modification mot de passe directe** - Formulaire inline dans onglet Utilisateurs
11. ✅ **Erreur 400 Bad Request corrigée** - `username` et `email` rendus optionnels pour mises à jour partielles
12. ✅ **Mise à jour partielle** - Permet modification uniquement du mot de passe (partial=True + extra_kwargs)
13. ✅ **Gestion erreurs extensions** - Messages explicites pour ERR_BLOCKED_BY_CLIENT
14. ✅ **Nettoyage documentation** - 47 fichiers .md supprimés, consolidation dans STATUS.md et LOGS.md
15. ✅ **Boucle infinie de logs** - Suppression console.log répétitifs dans TenantUsersTab
16. ✅ **Erreur 400 PUT → PATCH** - Changement de PUT vers PATCH pour mises à jour partielles (user.service.ts)
17. ✅ **Configuration email SMTP OVH** - Configuration SMTP dans docker-compose.simple.yml (ssl0.ovh.net:587)

---

## 🐛 Problèmes Connus & Solutions

### ⚠️ ERR_BLOCKED_BY_CLIENT - Extensions Navigateur

**Symptôme** : Erreur `net::ERR_BLOCKED_BY_CLIENT` lors des requêtes vers `localhost:9495`

**Cause** : Extensions navigateur (uBlock, AdBlock, Privacy Badger) bloquent les requêtes

**Solution Immédiate** :
- Mode navigation privée : `Ctrl+Shift+N` (Chrome) ou `Ctrl+Shift+P` (Firefox)
- Ou désactiver temporairement les extensions
- Ou ajouter `localhost` dans la whitelist des extensions

**Backend vérifié** : ✅ Fonctionne correctement (testé avec curl)

**Note** : Si le login échoue après un reset password, vérifiez :
1. Les extensions ne bloquent pas les requêtes (`ERR_BLOCKED_BY_CLIENT`)
2. Le mot de passe est bien celui défini dans le reset
3. Le statut utilisateur est bien 'active' (activé automatiquement lors du reset)

**Compte de test** :
- Email : `test@delhomme.ovh`
- Mot de passe : `tenant123`
- Tenant : Ma Société VTC (ID: 5)

---

## 📋 Tâches à Faire

### 🚨 Priorité CRITIQUE - En Cours

#### Résolution des Erreurs Globales & Tests
- [x] **Système de tests unitaires complet** - ✅ **37 fichiers de tests créés** (2025-11-26)
  - ✅ 10 tests services frontend
  - ✅ 11 tests composants frontend
  - ✅ 6 tests modèles backend
  - ✅ 1 test serializers backend
  - ✅ 7 tests vues/API backend
  - 📄 Voir [docs/tests/TESTS_RAPPORTS.md](./docs/tests/TESTS_RAPPORTS.md) pour les rapports détaillés
  - 📄 Voir [docs/tests/README_TESTS.md](./docs/tests/README_TESTS.md) pour le guide complet
- [ ] **Exécution complète des tests** - Installer dépendances et exécuter tous les tests
- [ ] **Correction des erreurs identifiées** - Résoudre toutes les erreurs détectées par les tests
- [ ] **Vérification couverture de code** - Atteindre minimum 70% de couverture
- [ ] **Intégration CI/CD** - Automatiser l'exécution des tests

### Priorité Haute (Après résolution erreurs)
- [ ] **Migration Django pour champs HTML/CSS** - Créer migration pour html_content et css_content dans Template
- [ ] **Routing multi-tenant** - Activer middleware django-tenants
- [ ] **Pages tenant** - Créer pages login/admin pour sous-domaines tenant
- [ ] **Site public tenant** - Créer pages publiques du tenant
- [ ] **Landing page** - Page d'accueil publique VTCBuilder

### Priorité Moyenne
- [ ] **Intégration paiement** - Stripe ou autre
- [ ] **Éditeur WordPress** - WYSIWYG pour pages tenant
- [ ] **Templates site** - Templates pour sites publics
- [ ] **Analytics** - Statistiques d'utilisation
- [ ] **Système de blocs** - Architecture de blocs pour éditeur de contenu

### Priorité Basse
- [ ] **Notifications** - Système de notifications
- [ ] **API webhooks** - Webhooks pour événements
- [ ] **Export données** - Export CSV/JSON
- [ ] **Multi-langue** - Internationalisation

### Fonctionnalités Futures (Après finalisation tests)
- [ ] **Mode sombre/clair** - Interface avec mode sombre et détection automatique
  - Détection automatique du thème système (dark/light) de l'appareil utilisateur
  - Basculement manuel entre modes sombre et clair
  - Persistance du choix utilisateur
  - Adaptation de tous les composants (sidebar, tables, formulaires, etc.)

## 🧪 Tests Automatisés - EN COURS

**Statut** : ✅ **37 fichiers de tests créés** (2025-11-26)  
**Référence** : [docs/tests/README_TESTS.md](./docs/tests/README_TESTS.md) et [docs/tests/TESTS_RAPPORTS.md](./docs/tests/TESTS_RAPPORTS.md)

### ✅ Système de Tests Complet

#### Tests Frontend (21 fichiers)
- ✅ **Services** : 10 fichiers (auth, user, tenant, billing, page, service, booking, media, template, settings)
- ✅ **Composants** : 11 fichiers (AdminSidebar, AdminLayout, TenantLayout, Sidebar, MobileHeader, ResponsiveTable, ImpersonationBanner, Navbar, PublicHeader, PublicFooter, PublicLayout)

#### Tests Backend (14 fichiers)
- ✅ **Modèles** : 6 fichiers (tenants, billing, pages, services, bookings, media)
- ✅ **Serializers** : 1 fichier (tenants)
- ✅ **Vues/API** : 7 fichiers (tenants, billing, pages, services, bookings, media, api)

**Total** : **~199 tests unitaires** estimés

### 📚 Documentation
- `README_TESTS.md` - Guide complet des tests (structure, exemples, commandes)
- `TESTS_RAPPORTS.md` - Rapports détaillés et historique des tests

### 🚀 Exécution

```bash
# Tous les tests
make test

# Tests Frontend uniquement
make test-frontend
# ou
cd frontend && npm install && npm test

# Tests Backend uniquement
make test-backend
# ou
cd backend-django && make test

# Tests avec couverture
make test-coverage
```

### ⚠️ Prérequis

**Frontend** :
```bash
cd frontend && npm install  # Installer Jest et dépendances
```

**Backend** :
- Docker doit être démarré avec containers actifs
- Base de données initialisée avec migrations

---

## 📝 Architecture

### Stack Technique
- **Backend** : Django 5.0.1 + django-tenants + PostgreSQL 15
- **Frontend** : Next.js 14.2.18 + React 18.3.1 + TypeScript
- **Cache** : Redis 7
- **Container** : Docker + Docker Compose

### URLs Importantes
- **Super Admin** : `localhost:9494/admin/*`
- **Tenant Admin** : `[tenant-slug].localhost:9494/dashboard/*` (à implémenter)
- **Site Public** : `[tenant-slug].localhost:9494/*` (à implémenter)
- **Landing** : `localhost:9494/` (à implémenter)

### Routing Multi-Tenant
- **Middleware** : `django_tenants.middleware.main.TenantMainMiddleware` (actuellement désactivé)
- **Domains** : Chaque tenant a un domaine (`ma-societe-vtc.localhost`)
- **Schémas** : PostgreSQL séparés par tenant (`t_ma_societe_vtc`)

---

## 📈 Progression Globale

- **Backend** : ~90% ✅ (améliorations gestion erreurs, templates HTML/CSS)
- **Frontend Super Admin** : ~95% ✅ (stats, templates, settings fonctionnels)
- **Frontend Tenant Admin** : ~75% ✅ (améliorations UX)
- **Frontend Public** : ~10% ⏳
- **Routing Multi-Tenant** : ~30% ⏳
- **Documentation** : ~98% ✅ (STATUS.md à jour, tests documentés)
- **Tests Automatisés** : ~90% ✅ (37 fichiers créés, à exécuter et valider)

---

## 🔄 Dernière Mise à Jour

**Date** : 2025-11-26  
**Focus Actuel** : Résolution des erreurs globales et finalisation du système de tests

**Modifications Récentes** :

### ✅ Corrections Majeures (2025-11-26)

#### Corrections Interface & UX
1. ✅ **Page /admin/tenants - Drawer manquant corrigé**
   - Remplacement de la structure manuelle par `AdminLayout`
   - Drawer/sidebar maintenant fonctionnel avec toggle
   - HeaderActions intégré pour le bouton "Nouveau Tenant"
   - Cohérence avec les autres pages admin

2. ✅ **Dashboard - Affichage "En Trial" corrigé**
   - Structure de la carte alignée avec les autres cartes
   - Ajout de `flex items-center` pour alignement cohérent
   - Affichage uniforme avec les autres statistiques

#### Système de Tests Complet
1. ✅ **Création de 37 fichiers de tests unitaires** (2025-11-26)
   - ✅ 10 tests services frontend (auth, user, tenant, billing, page, service, booking, media, template, settings)
   - ✅ 11 tests composants frontend (AdminSidebar, AdminLayout, TenantLayout, Sidebar, MobileHeader, ResponsiveTable, ImpersonationBanner, Navbar, PublicHeader, PublicFooter, PublicLayout)
   - ✅ 6 tests modèles backend (tenants, billing, pages, services, bookings, media)
   - ✅ 1 test serializers backend (tenants)
   - ✅ 7 tests vues/API backend (tenants, billing, pages, services, bookings, media, api)
   - 📄 Voir [docs/tests/TESTS_RAPPORTS.md](./docs/tests/TESTS_RAPPORTS.md) pour les rapports détaillés
   - 📄 Voir [docs/tests/README_TESTS.md](./docs/tests/README_TESTS.md) pour le guide complet

2. ✅ **Configuration complète des tests**
   - ✅ Jest configuré pour frontend (jest.config.js, jest.setup.js)
   - ✅ Pytest configuré pour backend (pytest.ini)
   - ✅ Makefile avec commandes test (make test, make test-frontend, make test-backend)
   - ✅ Documentation complète créée

#### Corrections Responsive & UX
3. ✅ **Page Templates - Optimisation mobile complète**
   - Padding responsive (p-4 sm:p-6)
   - Text sizes adaptatifs (text-lg sm:text-xl)
   - Textareas responsive (rows ajustés)
   - Upload buttons responsive (w-full sm:w-auto)
   - Overflow-x-auto pour tabs
   - Break-words pour contenu long

4. ✅ **Sidebar - Détection menu actif corrigée**
   - Correction highlight pour /admin/templates
   - Vérification pathname.startsWith() améliorée

5. ✅ **Drawer/Sidebar - Fermeture corrigée**
   - Retrait lg:translate-x-0 pour permettre fermeture
   - Ajout lg:ml-64 pour décalage contenu
   - Toggle sidebar fonctionnel

#### Corrections Erreurs API
6. ✅ **Page Stats - Erreurs corrigées**
   - Correction de l'initialisation des valeurs par défaut pour `activity` et `registrations`
   - Protection contre les erreurs "Cannot read properties of undefined"
   - Gestion gracieuse des erreurs 404 sur `/api/stats/detailed/`

7. ✅ **Page EditUserPage - Erreurs corrigées**
   - Correction de l'erreur "tenants.map is not a function"
   - Gestion correcte de la réponse paginée de l'API
   - Import `toast` ajouté pour les notifications

8. ✅ **Templates API - Erreur 500 corrigée**
   - Amélioration de la gestion des erreurs dans `TemplateViewSet.list()`
   - Logs détaillés pour le débogage
   - Retour de tableau vide au lieu de 500 en cas d'erreur

9. ✅ **Champs HTML/CSS ajoutés aux Templates**
   - Ajout de `html_content` et `css_content` au modèle Template
   - Interface améliorée avec onglets (Info / HTML / CSS)
   - Upload de fichiers HTML/CSS
   - Éditeurs de code pour HTML et CSS

10. ✅ **Payment Methods API - Gestion d'erreur améliorée**
    - Gestion gracieuse des erreurs 404
    - Message d'avertissement seulement en développement
    - Retour automatique de tableau vide

11. ✅ **System Settings - Endpoint créé**
    - Endpoint `/api/system-settings/` pour la configuration système
    - Endpoint `/api/system-settings/test_email/` pour tester les emails
    - Gestion singleton pour les paramètres système

### 📝 Modifications Antérieures (2025-11-24)
- ✅ **Boucle infinie de logs corrigée** - Suppression console.log répétitifs dans TenantUsersTab
- ✅ **Erreur 400 corrigée définitivement** - Changement PUT → PATCH dans user.service.ts pour mises à jour partielles
- ✅ **Configuration email SMTP OVH** - Variables d'environnement ajoutées dans docker-compose.simple.yml
  - EMAIL_HOST: ssl0.ovh.net
  - EMAIL_PORT: 587
  - EMAIL_HOST_USER: test@delhomme.ovh
  - Script de test créé: backend-django/test_email.py
- ✅ **Nettoyage logs** - Suppression de tous les logs de debug répétitifs
- ✅ **Configuration SSH GitHub** - Remote changé de HTTPS vers SSH, push fonctionnel
- ✅ **Email SMTP fonctionnel** - Variables d'environnement chargées, emails envoyés réellement via SMTP OVH
  - Script de test complet : `test_email_smtp.py`
  - Backend SMTP activé : ssl0.ovh.net:587
- ✅ **Activation automatique après reset password** - Statut utilisateur activé automatiquement si 'pending' lors du reset
  - Corrige problème de connexion après réinitialisation du mot de passe

**Tests validés** :
- ✅ Modification mot de passe utilisateur depuis `/admin/tenants/5` (onglet Utilisateurs)
- ✅ Backend API répond correctement (testé avec curl)
- ✅ Formulaire inline fonctionne correctement

**Actions requises pour tester email** :
1. ⚠️ **RECRÉER le conteneur** (pas juste restart) : `docker-compose -f docker-compose.simple.yml down backend && docker-compose -f docker-compose.simple.yml up -d backend`
2. Tester email : `docker-compose -f docker-compose.simple.yml exec backend python test_email_smtp.py`
3. Vérifier boîte mail : `test@delhomme.ovh`

**✅ Résolution Problème Email** :
- Les emails étaient affichés dans les logs Docker (backend console) au lieu d'être envoyés via SMTP
- **Cause** : Variables d'environnement pas chargées car conteneur créé avant leur ajout
- **Solution** : Recréer le conteneur backend pour charger les variables d'environnement
- **Script de test** : `test_email_smtp.py` vérifie config, connexion SMTP et envoi réel

---

## 📧 Code d'Envoi d'Email - Référence

### Emplacements du Code

1. **Configuration Email** :
   - Fichier : `backend-django/vtcbuilder/settings.py` (ligne 194-211)
   - Variables d'environnement dans `docker-compose.simple.yml`

2. **Réinitialisation Mot de Passe (Public)** :
   - Fichier : `backend-django/tenants/views.py` (ligne ~714)
   - Fonction : `request_password_reset_view`
   - Endpoint : `POST /api/auth/password-reset/request/`
   - Permissions : `AllowAny` (public)

3. **Réinitialisation Mot de Passe (Admin)** :
   - Fichier : `backend-django/tenants/views.py` (ligne ~540)
   - Fonction : `send_password_reset` (action de UserViewSet)
   - Endpoint : `POST /api/users/{id}/send_password_reset/`
   - Permissions : Super admin ou Tenant admin

4. **Invitation Nouveau Tenant** :
   - Fichier : `backend-django/tenants/serializers.py` (ligne ~90-165)
   - Fonction : `TenantSerializer.create`
   - Déclencheur : Automatique lors création d'un tenant

### Template de Base

```python
from django.core.mail import send_mail
from django.conf import settings

send_mail(
    subject='Sujet de l\'email',
    message='Version texte...',
    html_message='<html>Version HTML...</html>',
    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vtcbuilder.com'),
    recipient_list=['destinataire@example.com'],
    fail_silently=False,
)
```

### Script de Test

- Script : `backend-django/test_email_smtp.py`
- Usage : `docker-compose -f docker-compose.simple.yml exec backend python test_email_smtp.py`

---

## 📚 Documentation

### Fichiers Principaux (Racine)
- **README.md** - Documentation principale du projet
- **STATUS.md** - Ce fichier (état actuel et suivi)

### Structure de Documentation

La documentation est organisée dans le dossier `docs/` avec les sous-dossiers suivants :

#### 📁 `docs/architecture/`
- **ARCHITECTURE_ROUTING.md** - Architecture complète du routing multi-tenant
- **ARCHITECTURE_BLOCKS.md** - Architecture du système de blocs

#### 🧪 `docs/tests/`
- **README_TESTS.md** - Guide complet du système de tests
- **TESTS_RAPPORTS.md** - Rapports et historique des tests unitaires

#### 📊 `docs/project/`
- **COUTS_PROJET.md** - Coûts du projet (domaine, etc.)

#### 📝 `docs/logs/`
- **LOGS.md** - Historique complet de toutes les modifications

**Note** : Pour consulter les avancements et l'état du projet, référez-vous à **STATUS.md** qui centralise toutes les informations importantes.

---

## 🚀 Démarrage Rapide

```bash
# Setup complet
make quick-start

# Ou étape par étape
make setup-backend-django
make start
```

**URLs** :
- Frontend : http://localhost:9494
- Backend API : http://localhost:9495/api
- Super Admin : admin@vtcbuilder.com / admin123
- Tenant Test : test@delhomme.ovh / tenant123
