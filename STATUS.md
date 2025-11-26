# 📊 STATUS - État du Projet VTCBuilder

> **Fichier centralisé de suivi - Toute information importante pour le développement**

---

## 🎯 État Actuel (2025-11-26)

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
- ✅ Mise à jour partielle utilisateurs (permet modification uniquement du mot de passe)

#### Frontend Next.js
- ✅ Interface super admin complète
- ✅ Interface tenant admin (WordPress-style)
- ✅ Pages de login/register/forgot-password/reset-password
- ✅ Gestion responsive (mobile-first)
- ✅ Navigation avec sidebar
- ✅ Gestion utilisateurs tenant
- ✅ Gestion facturation tenant
- ✅ Modification mot de passe directe dans liste utilisateurs

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

1. ✅ **Statistiques dashboard** - Exclusion tenants soft-deleted
2. ✅ **Affichage utilisateurs tenant** - Filtre par tenant_id corrigé
3. ✅ **Mot de passe tenant** - Changé en `tenant123`
4. ✅ **Modification mot de passe directe** - Formulaire inline dans onglet Utilisateurs
5. ✅ **Erreur 400 Bad Request corrigée** - `username` et `email` rendus optionnels pour mises à jour partielles
6. ✅ **Mise à jour partielle** - Permet modification uniquement du mot de passe (partial=True + extra_kwargs)
7. ✅ **Gestion erreurs extensions** - Messages explicites pour ERR_BLOCKED_BY_CLIENT
8. ✅ **Nettoyage documentation** - 47 fichiers .md supprimés, consolidation dans STATUS.md et LOGS.md
9. ✅ **Boucle infinie de logs** - Suppression console.log répétitifs dans TenantUsersTab
10. ✅ **Erreur 400 PUT → PATCH** - Changement de PUT vers PATCH pour mises à jour partielles (user.service.ts)
11. ✅ **Configuration email SMTP OVH** - Configuration SMTP dans docker-compose.simple.yml (ssl0.ovh.net:587)

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

**Compte de test** :
- Email : `test@delhomme.ovh`
- Mot de passe : `tenant123`
- Tenant : Ma Société VTC (ID: 5)

---

## 📋 Tâches à Faire

### Priorité Haute
- [ ] **Routing multi-tenant** - Activer middleware django-tenants
- [ ] **Pages tenant** - Créer pages login/admin pour sous-domaines tenant
- [ ] **Site public tenant** - Créer pages publiques du tenant
- [ ] **Landing page** - Page d'accueil publique VTCBuilder

### Priorité Moyenne
- [ ] **Intégration paiement** - Stripe ou autre
- [ ] **Éditeur WordPress** - WYSIWYG pour pages tenant
- [ ] **Templates site** - Templates pour sites publics
- [ ] **Analytics** - Statistiques d'utilisation

### Priorité Basse
- [ ] **Notifications** - Système de notifications
- [ ] **API webhooks** - Webhooks pour événements
- [ ] **Export données** - Export CSV/JSON
- [ ] **Multi-langue** - Internationalisation

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

- **Backend** : ~85% ✅
- **Frontend Super Admin** : ~90% ✅
- **Frontend Tenant Admin** : ~70% ✅
- **Frontend Public** : ~10% ⏳
- **Routing Multi-Tenant** : ~30% ⏳
- **Documentation** : ~95% ✅

---

## 🔄 Dernière Mise à Jour

**Date** : 2025-11-26 13:40

**Modifications** :
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

- **README.md** - Documentation principale du projet
- **LOGS.md** - Historique complet de toutes les modifications
- **STATUS.md** - Ce fichier (état actuel et suivi)
- **ARCHITECTURE_ROUTING.md** - Architecture complète du routing multi-tenant

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
