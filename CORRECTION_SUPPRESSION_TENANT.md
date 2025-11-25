# 🔧 Correction Suppression Tenant - Documentation

## 🐛 Problème Identifié

L'erreur `ProgrammingError: relation "pages" does not exist` se produit car Django's Collector essaie de vérifier les relations foreign key dans le schéma du tenant lors de la suppression, mais ce schéma peut ne pas exister ou ne pas avoir toutes les tables.

## ✅ Solution Implémentée

### Ordre de Suppression

1. **Supprimer tous les objets liés dans le schéma public** :
   - InvitationToken
   - PasswordResetToken
   - Users du tenant
   - Domain objects

2. **Supprimer le schéma PostgreSQL directement via SQL** :
   - `DROP SCHEMA IF EXISTS "{schema_name}" CASCADE;`
   - Cela évite que Django essaie d'accéder au schéma

3. **Supprimer l'enregistrement tenant** :
   - Une fois le schéma supprimé, Django ne peut plus y accéder
   - Suppression via queryset pour éviter le Collector

### Code de Suppression

```python
def destroy(self, request, *args, **kwargs):
    # 1. Supprimer tous les objets liés dans public schema
    InvitationToken.objects.filter(tenant=tenant).delete()
    PasswordResetToken.objects.filter(user_id__in=tenant_users).delete()
    User.objects.filter(id__in=tenant_users).delete()
    Domain.objects.filter(tenant=tenant).delete()
    
    # 2. Supprimer le schéma PostgreSQL directement
    cursor.execute(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE;')
    
    # 3. Supprimer le tenant
    Tenant.objects.filter(id=tenant_id).delete()
```

## 🔒 Sécurité

- Transaction atomique : tout ou rien
- Logging détaillé pour le débogage
- Gestion d'erreurs robuste

---

**✅ La suppression de tenant devrait maintenant fonctionner correctement !**

