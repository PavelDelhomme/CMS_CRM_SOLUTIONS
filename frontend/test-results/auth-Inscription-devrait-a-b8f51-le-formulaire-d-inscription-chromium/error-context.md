# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Créer un compte" [level=1] [ref=e6]
      - paragraph [ref=e7]: Démarrez votre plateforme CMS/CRM
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: Nom de votre entreprise *
        - textbox "Nom de votre entreprise *" [ref=e11]:
          - /placeholder: Ma Société
      - generic [ref=e12]:
        - generic [ref=e13]: Email *
        - textbox "Email *" [ref=e14]:
          - /placeholder: votre@email.com
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: Prénom
          - textbox "Prénom" [ref=e18]
        - generic [ref=e19]:
          - generic [ref=e20]: Nom
          - textbox "Nom" [ref=e21]
      - generic [ref=e22]:
        - generic [ref=e23]: Mot de passe *
        - textbox "Mot de passe *" [ref=e24]:
          - /placeholder: Au moins 8 caractères
      - generic [ref=e25]:
        - generic [ref=e26]: Confirmer le mot de passe *
        - textbox "Confirmer le mot de passe *" [ref=e27]:
          - /placeholder: Répétez le mot de passe
      - button "🚀 Créer mon compte" [ref=e28] [cursor=pointer]
    - paragraph [ref=e30]:
      - text: Déjà un compte ?
      - link "Se connecter" [ref=e31] [cursor=pointer]:
        - /url: /login
  - alert [ref=e32]
```