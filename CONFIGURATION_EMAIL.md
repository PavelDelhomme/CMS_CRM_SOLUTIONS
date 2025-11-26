# 📧 Configuration de l'Envoi d'Emails

## Configuration SMTP avec OVH Mail

Pour activer l'envoi d'emails via OVH Mail (maily.ovh), vous devez configurer les variables d'environnement suivantes.

### Variables d'Environnement Requises

Ajoutez ces variables dans votre fichier `.env` (backend-django/.env) :

```bash
# Configuration SMTP OVH Mail
EMAIL_HOST=ssl0.ovh.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=noreply@vtcbuilder.com
EMAIL_HOST_PASSWORD=votre_mot_de_passe_email

# Email d'expéditeur
DEFAULT_FROM_EMAIL=noreply@vtcbuilder.com

# URL du frontend (pour les liens dans les emails)
FRONTEND_URL=http://localhost:9494
```

### Configuration pour OVH Mail (maily.ovh)

#### Paramètres SMTP OVH :
- **Serveur SMTP** : `ssl0.ovh.net` (ou `smtp.mailtrap.io` pour le développement)
- **Port** : `587` (TLS) ou `465` (SSL)
- **Sécurité** : TLS recommandé (port 587)
- **Utilisateur** : Votre adresse email complète (ex: `noreply@vtcbuilder.com`)
- **Mot de passe** : Le mot de passe de votre boîte mail OVH

#### Alternative : Port 465 (SSL)
Si vous préférez utiliser SSL au lieu de TLS :

```bash
EMAIL_PORT=465
EMAIL_USE_TLS=False
EMAIL_USE_SSL=True
```

### Exemple de Configuration Complète

**Pour OVH Mail avec TLS (recommandé)** :
```bash
EMAIL_HOST=ssl0.ovh.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=noreply@vtcbuilder.com
EMAIL_HOST_PASSWORD=VotreMotDePasseSecurise
DEFAULT_FROM_EMAIL=noreply@vtcbuilder.com
FRONTEND_URL=https://vtcbuilder.com
```

**Pour le développement (console)** :
Laissez les variables vides ou non définies pour que les emails s'affichent dans la console.

```bash
# EMAIL_HOST=
# EMAIL_HOST_USER=
# EMAIL_HOST_PASSWORD=
# → Utilisera automatiquement le backend console
```

## Types d'Emails Envoyés

### 1. Invitation de Compte Tenant
- **Quand** : Lors de la création d'un nouveau tenant
- **Destinataire** : L'admin du tenant (email configuré)
- **Contenu** : Lien de configuration avec token d'invitation
- **Fichier** : `backend-django/tenants/serializers.py` (méthode `TenantSerializer.create`)

### 2. Réinitialisation de Mot de Passe
- **Quand** : Lorsqu'un utilisateur demande un reset de mot de passe
- **Destinataire** : L'utilisateur qui a demandé le reset
- **Contenu** : Lien de réinitialisation avec token
- **Fichier** : `backend-django/tenants/views.py` (méthode `request_password_reset_view`)

### 3. Réinitialisation de Mot de Passe par Admin
- **Quand** : Lorsqu'un admin envoie un lien de reset à un utilisateur
- **Destinataire** : L'utilisateur sélectionné
- **Contenu** : Lien de réinitialisation avec token
- **Fichier** : `backend-django/tenants/views.py` (méthode `send_password_reset`)

## Test de l'Envoi d'Emails

### En Mode Développement
Les emails s'affichent dans les logs Docker :
```bash
docker logs -f vtcbuilder_backend
```

Vous verrez le contenu complet de l'email dans la console.

### En Mode Production (SMTP configuré)
Les emails sont envoyés réellement via SMTP. Vous pouvez :
1. Vérifier les logs pour voir si l'envoi a réussi
2. Vérifier la boîte de réception du destinataire
3. Vérifier les spams si l'email n'arrive pas

## Dépannage

### Les emails ne partent pas

1. **Vérifier les variables d'environnement** :
   ```bash
   docker exec vtcbuilder_backend env | grep EMAIL
   ```

2. **Vérifier les logs** :
   ```bash
   docker logs vtcbuilder_backend | grep -i email
   ```

3. **Tester la connexion SMTP** :
   - Vérifier que le mot de passe est correct
   - Vérifier que le port est ouvert (587 ou 465)
   - Vérifier que l'adresse email existe sur OVH

### Erreur "SMTP Authentication failed"

- Vérifier que `EMAIL_HOST_USER` est l'adresse email complète
- Vérifier que `EMAIL_HOST_PASSWORD` est correct
- Pour OVH, certains comptes nécessitent un "Mot de passe d'application" plutôt que le mot de passe principal

### Erreur "Connection timeout"

- Vérifier que le serveur SMTP est correct : `ssl0.ovh.net`
- Vérifier que le port est ouvert dans le firewall
- Essayer avec le port 465 (SSL) si 587 ne fonctionne pas

## Configuration Automatique

Le système choisit automatiquement le bon backend :
- **Si SMTP configuré** (EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD présents) → Utilise SMTP
- **Sinon** → Utilise Console backend (emails dans les logs)

## Sécurité

⚠️ **IMPORTANT** :
- Ne jamais commiter le fichier `.env` avec les mots de passe
- Utiliser des variables d'environnement sécurisées en production
- Utiliser un mot de passe d'application dédié pour OVH Mail
- Activer l'authentification à deux facteurs sur le compte email si possible

---

**Date** : 2025-11-26
**Status** : ✅ Configuré et prêt à l'emploi

