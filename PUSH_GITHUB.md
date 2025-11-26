# 📤 Push vers GitHub - Instructions

## ✅ État Actuel

Tous les commits sont prêts à être poussés vers GitHub sur la branche `dev`.

## 🚀 Commandes pour Push

### Option 1 : Push avec authentification GitHub

```bash
git push origin dev
```

Si vous êtes demandé pour vos identifiants :
- **Username** : Votre nom d'utilisateur GitHub
- **Password** : Utilisez un **Personal Access Token** (pas votre mot de passe)

### Option 2 : Configurer SSH (recommandé)

1. Vérifier si vous avez une clé SSH :
```bash
ls -la ~/.ssh/id_rsa.pub
```

2. Si vous n'en avez pas, en créer une :
```bash
ssh-keygen -t rsa -b 4096 -C "votre@email.com"
```

3. Ajouter la clé à GitHub (Settings > SSH and GPG keys)

4. Changer l'URL du remote :
```bash
git remote set-url origin git@github.com:PavelDelhomme/CMS_CRM_SOLUTIONS.git
```

5. Puis push :
```bash
git push origin dev
```

## 📋 Commits à Pousser

Les derniers commits incluent :
- ✅ Configuration tenant de test avec test@delhomme.ovh
- ✅ Suppression tenant Demo VTC Company
- ✅ Nettoyage utilisateurs orphelins
- ✅ Plans tarifaires et système de quotas
- ✅ Améliorations interface et debug
- ✅ Gestion utilisateurs complète

## 🔍 Vérification

Après le push, vérifiez sur GitHub :
- https://github.com/PavelDelhomme/CMS_CRM_SOLUTIONS/tree/dev

---

**Note** : Si vous avez des problèmes d'authentification, utilisez un Personal Access Token GitHub au lieu de votre mot de passe.

