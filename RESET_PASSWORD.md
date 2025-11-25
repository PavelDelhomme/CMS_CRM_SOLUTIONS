# 🔐 Système de Reset Password - Documentation

## ✅ Ce qui a été créé

### 1. Backend - Modèle PasswordResetToken
- ✅ Modèle créé dans `tenants/models.py`
- ✅ Token unique avec expiration (24 heures)
- ✅ Système de validation et marquage comme utilisé

### 2. Backend - Endpoints API

#### Pour l'Admin
- `POST /api/users/{id}/send_password_reset/` - Envoyer email de reset
  - **Permission** : Super Admin uniquement
  - **Action** : Génère un token, envoie un email avec lien de reset

#### Pour l'Utilisateur
- `POST /api/auth/reset-password/` - Réinitialiser le mot de passe
  - **Permission** : Publique
  - **Paramètres** : `token`, `email`, `password`

- `POST /api/auth/verify-reset-token/` - Vérifier la validité d'un token
  - **Permission** : Publique
  - **Retourne** : `valid: boolean`, `expires_at: string`

### 3. Frontend - Interface Admin
- ✅ Bouton "Réinitialiser le mot de passe" dans `/admin/users`
- ✅ Icône de cadenas dans la colonne Actions
- ✅ Confirmation avant envoi
- ✅ Message de succès/erreur

### 4. Frontend - Page de Reset Password
- ✅ Page `/reset-password` créée
- ✅ Vérification automatique du token
- ✅ Formulaire de réinitialisation
- ✅ Validation des mots de passe
- ✅ Redirection vers login après succès

## 🔧 Fonctionnement

### Flow Complet

1. **Admin demande reset** :
   - Admin va sur `/admin/users`
   - Clique sur l'icône de cadenas pour un utilisateur
   - Confirme l'envoi
   - Backend génère un token valide 24h
   - Email envoyé avec lien : `/reset-password?token=xxx&email=yyy`

2. **Utilisateur reçoit email** :
   - Email HTML avec lien cliquable
   - Lien contient token et email

3. **Utilisateur reset password** :
   - Accède à `/reset-password?token=xxx&email=yyy`
   - Token vérifié automatiquement
   - Si valide, formulaire affiché
   - Utilisateur entre nouveau mot de passe
   - Password reset et token marqué comme utilisé

### Sécurité

- ✅ Token unique et sécurisé (64 caractères aléatoires)
- ✅ Expiration automatique après 24h
- ✅ Token marqué comme utilisé après reset
- ✅ Vérification de l'email correspondant au token
- ✅ Validation du mot de passe (min 8 caractères)

## 📧 Configuration Email

Pour l'envoi d'emails en production, configurer dans `.env` :

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com  # ou autre serveur SMTP
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-app
DEFAULT_FROM_EMAIL=noreply@vtcbuilder.com
FRONTEND_URL=https://votre-domaine.com
```

En développement, les emails sont affichés dans la console (console backend).

## 🎯 Utilisation

### Pour l'Admin

1. Aller sur `/admin/users`
2. Trouver l'utilisateur
3. Cliquer sur l'icône de cadenas 🔒
4. Confirmer l'envoi
5. L'utilisateur recevra un email avec le lien

### Pour l'Utilisateur

1. Recevoir l'email
2. Cliquer sur le lien dans l'email
3. Entrer le nouveau mot de passe (min 8 caractères)
4. Confirmer le mot de passe
5. Se connecter avec le nouveau mot de passe

## 🐛 Dépannage

### Email non reçu
- Vérifier les logs du backend (console en dev)
- Vérifier la configuration SMTP
- Vérifier le dossier spam

### Token invalide
- Le token expire après 24h
- Le token ne peut être utilisé qu'une fois
- Vérifier que l'email correspond

### Erreur backend
- Vérifier les migrations appliquées
- Vérifier la configuration email
- Vérifier les logs Django

---

**✅ Le système de reset password est maintenant opérationnel !**

