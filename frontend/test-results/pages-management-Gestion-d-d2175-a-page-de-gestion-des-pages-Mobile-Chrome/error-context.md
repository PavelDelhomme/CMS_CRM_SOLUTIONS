# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - heading "CMS_CRM_SOLUTIONS" [level=1] [ref=e5]
        - generic [ref=e6]:
          - link "Dashboard" [ref=e7] [cursor=pointer]:
            - /url: /dashboard
          - link "Déconnexion" [ref=e8] [cursor=pointer]:
            - /url: /login
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - heading "Gestion des Pages" [level=2] [ref=e12]
          - paragraph [ref=e13]: Créez et gérez les pages de votre site
        - link "+ Nouvelle Page" [ref=e14] [cursor=pointer]:
          - /url: /dashboard/pages/new
      - generic [ref=e15]:
        - paragraph [ref=e16]: 📄
        - heading "Aucune page" [level=3] [ref=e17]
        - paragraph [ref=e18]: Commencez par créer votre première page.
        - link "+ Créer une page" [ref=e19] [cursor=pointer]:
          - /url: /dashboard/pages/new
  - alert [ref=e20]
```