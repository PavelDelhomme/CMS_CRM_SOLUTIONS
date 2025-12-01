# 🔄 Plan de Réorganisation

## Structure Proposée

```
backend-django/
├── config/              # Configuration Django
│   └── core/           # Settings, URLs, WSGI, ASGI
│
├── apps/                # Applications Django
│   ├── tenants/
│   ├── billing/
│   ├── pages/
│   ├── content/
│   ├── blocks/
│   ├── media/
│   ├── bookings/
│   ├── services/
│   ├── settings_app/
│   └── api/
│
├── scripts/            # Scripts shell
│   └── setup_cron.sh
│
├── tools/              # Outils de développement
│   ├── management/     # Management commands globaux
│   └── test_*.py
│
├── tests/              # Tests
│   ├── unit/
│   └── integration/
│
└── docs/               # Documentation backend
```

## État Actuel

- [x] Dossiers créés
- [ ] Applications déplacées vers apps/
- [ ] Configuration déplacée vers config/
- [ ] Scripts déplacés vers scripts/
- [ ] Tests réorganisés
- [ ] Imports mis à jour
- [ ] Dockerfiles mis à jour
- [ ] Documentation mise à jour
