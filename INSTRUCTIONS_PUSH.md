# 📤 Instructions pour Push vers GitHub

## ✅ État Actuel

Vous êtes sur la branche `dev` avec **plusieurs commits** prêts à être poussés vers GitHub.

## 🚀 Push vers GitHub

### Option 1 : Push Direct (avec identifiants)

Exécutez cette commande dans votre terminal :

```bash
cd /home/pactivisme/Documents/Dev/Perso/CMS_CRM_Solutions/CMS_CRM_SOLUTIONS
git push origin dev
```

**Important** : Si vous êtes demandé pour vos identifiants :
- **Username** : Votre nom d'utilisateur GitHub (`PavelDelhomme`)
- **Password** : Utilisez un **Personal Access Token** (PAS votre mot de passe GitHub)

### Créer un Personal Access Token

1. Allez sur GitHub : https://github.com/settings/tokens
2. Cliquez sur "Generate new token (classic)"
3. Donnez-lui un nom (ex: "VTCBuilder Dev")
4. Sélectionnez les permissions : `repo` (accès complet aux dépôts)
5. Cliquez sur "Generate token"
6. **Copiez le token** (vous ne le verrez qu'une fois)
7. Utilisez ce token comme mot de passe lors du push

### Option 2 : Configurer SSH (Recommandé pour l'avenir)

1. Vérifier si vous avez une clé SSH :
```bash
ls -la ~/.ssh/id_rsa.pub
```

2. Si vous n'en avez pas, créer une clé SSH :
```bash
ssh-keygen -t rsa -b 4096 -C "votre@email.com"
# Appuyez sur Entrée pour accepter les valeurs par défaut
```

3. Afficher votre clé publique :
```bash
cat ~/.ssh/id_rsa.pub
```

4. Ajouter la clé à GitHub :
   - Allez sur : https://github.com/settings/ssh/new
   - Collez le contenu de `~/.ssh/id_rsa.pub`
   - Cliquez sur "Add SSH key"

5. Changer l'URL du remote :
```bash
git remote set-url origin git@github.com:PavelDelhomme/CMS_CRM_SOLUTIONS.git
```

6. Puis push :
```bash
git push origin dev
```

## 📋 Commits à Pousser

Les commits incluent :
- ✅ Configuration tenant de test avec `test@delhomme.ovh`
- ✅ Suppression tenant Demo VTC Company
- ✅ Nettoyage utilisateurs orphelins
- ✅ Plans tarifaires et système de quotas
- ✅ Améliorations interface et debug
- ✅ Gestion utilisateurs complète
- ✅ Affichage utilisateurs dans détails tenant
- ✅ Et bien plus...

## 🔍 Vérification après Push

Après le push, vérifiez sur GitHub :
- https://github.com/PavelDelhomme/CMS_CRM_SOLUTIONS/tree/dev

---

**Note** : Si vous avez des problèmes, vous pouvez aussi utiliser GitHub Desktop ou l'interface web de GitHub pour faire le push.

