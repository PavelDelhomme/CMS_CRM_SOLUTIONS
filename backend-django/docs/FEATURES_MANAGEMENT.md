# Gestion des Fonctionnalités par Abonnement

Ce document explique comment gérer les fonctionnalités selon les abonnements dans CMS CRM Solutions.

## Vue d'ensemble

Le système de gestion des fonctionnalités permet de :
- ✅ Restreindre l'accès aux fonctionnalités selon le plan d'abonnement
- ✅ Donner accès à toutes les fonctionnalités pour le super admin
- ✅ Gérer les fonctionnalités disponibles pour chaque plan tarifaire

## Architecture

### 1. Modèle `Feature` (tenants/models.py)

Chaque fonctionnalité est définie avec :
- `name` : Identifiant unique (ex: `'blocks-editor'`, `'analytics'`)
- `label` : Nom affiché
- `description` : Description de la fonctionnalité
- `available_plans` : Relation ManyToMany avec `PricingPlan`
- `is_active` : Si la fonctionnalité est active

### 2. Modèle `PricingPlan` (billing/models.py)

Chaque plan tarifaire définit :
- `name` : Nom du plan (Starter, Business, Enterprise)
- `slug` : Identifiant unique
- `price_monthly` / `price_yearly` : Prix
- `max_sites`, `max_users`, `max_storage_gb` : Limites

### 3. Modèle `Subscription` (billing/models.py)

Chaque tenant a un abonnement qui :
- Lie le tenant à un `PricingPlan`
- Définit le statut (`active`, `trial`, `cancelled`, etc.)
- Gère les dates de période

## Comment gérer les fonctionnalités

### Créer une nouvelle fonctionnalité

1. **Via l'interface admin Django** :
   - Aller dans `/admin/tenants/feature/`
   - Cliquer sur "Ajouter Feature"
   - Remplir les champs :
     - Name : `'ma-nouvelle-feature'`
     - Label : `'Ma Nouvelle Fonctionnalité'`
     - Description : Description de la fonctionnalité
     - Available plans : Sélectionner les plans qui y ont accès
     - Is active : Cocher si la fonctionnalité est active

2. **Via une commande de management** :
   ```python
   from tenants.models import Feature
   from billing.models import PricingPlan
   
   # Récupérer les plans
   starter = PricingPlan.objects.get(slug='starter')
   business = PricingPlan.objects.get(slug='business')
   enterprise = PricingPlan.objects.get(slug='enterprise')
   
   # Créer la fonctionnalité
   feature = Feature.objects.create(
       name='ma-nouvelle-feature',
       label='Ma Nouvelle Fonctionnalité',
       description='Description...',
       is_active=True,
   )
   
   # Associer aux plans
   feature.available_plans.set([starter, business, enterprise])
   ```

3. **Via la commande `init_features`** :
   - Modifier `backend-django/tenants/management/commands/init_features.py`
   - Ajouter votre fonctionnalité dans la liste `features`
   - Exécuter : `python manage.py init_features`

### Vérifier l'accès à une fonctionnalité

#### Dans le backend (Python/Django)

```python
from tenants.models import User

user = User.objects.get(email='test@example.com')

# Vérifier si l'utilisateur peut utiliser une fonctionnalité
if user.can_use_feature('analytics'):
    # L'utilisateur a accès à analytics
    pass
```

#### Dans le frontend (React/TypeScript)

```typescript
import { useFeatures } from '@/contexts/FeaturesContext'

function MyComponent() {
  const { hasFeature } = useFeatures()
  
  if (hasFeature('analytics')) {
    // Afficher la fonctionnalité analytics
    return <AnalyticsDashboard />
  }
  
  return <UpgradePrompt />
}
```

### Fonctionnalités disponibles par défaut

Les fonctionnalités sont initialisées via `init_features.py` :

| Fonctionnalité | Starter | Business | Enterprise | Super Admin |
|---------------|---------|----------|------------|-------------|
| blocks-editor | ✅ | ✅ | ✅ | ✅ |
| media-library | ✅ | ✅ | ✅ | ✅ |
| blog-articles | ✅ | ✅ | ✅ | ✅ |
| themes | ✅ | ✅ | ✅ | ✅ |
| analytics | ❌ | ✅ | ✅ | ✅ |
| advanced-blocks | ❌ | ✅ | ✅ | ✅ |
| custom-templates | ✅ | ✅ | ✅ | ✅ |
| seo-tools | ❌ | ✅ | ✅ | ✅ |
| email-marketing | ❌ | ❌ | ✅ | ✅ |
| multi-language | ❌ | ❌ | ✅ | ✅ |

**Note** : Le super admin a toujours accès à TOUTES les fonctionnalités, peu importe son abonnement.

## Exemples d'utilisation

### Exemple 1 : Restreindre une route API

```python
# backend-django/api/views.py
from tenants.models import User

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    user = request.user
    
    # Vérifier l'accès
    if not user.can_use_feature('analytics'):
        return Response(
            {'error': 'Cette fonctionnalité nécessite un abonnement Business ou Enterprise'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Code de la vue analytics
    return Response({'data': '...'})
```

### Exemple 2 : Masquer un bouton dans le frontend

```typescript
// frontend/src/components/Dashboard.tsx
import { useFeatures } from '@/contexts/FeaturesContext'

export default function Dashboard() {
  const { hasFeature } = useFeatures()
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {hasFeature('analytics') && (
        <button onClick={() => router.push('/analytics')}>
          Voir les statistiques
        </button>
      )}
      
      {!hasFeature('analytics') && (
        <div className="upgrade-prompt">
          <p>Passez à Business pour accéder aux statistiques</p>
          <button onClick={() => router.push('/pricing')}>
            Voir les plans
          </button>
        </div>
      )}
    </div>
  )
}
```

### Exemple 3 : Limiter l'utilisation d'une fonctionnalité

```python
# backend-django/pages/views.py
from tenants.models import User
from billing.models import PricingPlan

def create_page(request):
    user = request.user
    
    # Vérifier la limite de pages selon le plan
    plan = user.tenant.subscription.plan
    current_pages_count = Page.objects.filter(tenant=user.tenant).count()
    
    if current_pages_count >= plan.max_sites:
        return Response(
            {'error': f'Limite de {plan.max_sites} pages atteinte. Passez à un plan supérieur.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Créer la page
    ...
```

## Commandes utiles

### Initialiser les fonctionnalités
```bash
docker exec cms_crm_backend python manage.py init_features
```

### Vérifier les fonctionnalités d'un tenant
```bash
docker exec cms_crm_backend python manage.py shell
>>> from tenants.models import User, Tenant
>>> tenant = Tenant.objects.get(slug='test-starter')
>>> user = User.objects.filter(tenant=tenant).first()
>>> user.can_use_feature('analytics')
False
>>> user.can_use_feature('blocks-editor')
True
```

### Lister toutes les fonctionnalités
```bash
docker exec cms_crm_backend python manage.py shell
>>> from tenants.models import Feature
>>> for f in Feature.objects.filter(is_active=True):
...     print(f"{f.name}: {[p.name for p in f.available_plans.all()]}")
```

## Bonnes pratiques

1. **Toujours vérifier l'accès** avant d'exposer une fonctionnalité
2. **Donner accès au super admin** à toutes les fonctionnalités
3. **Utiliser des messages clairs** quand l'accès est refusé
4. **Proposer une upgrade** quand une fonctionnalité n'est pas disponible
5. **Tester avec différents plans** pour vérifier les restrictions

## Dépannage

### Un utilisateur ne peut pas accéder à une fonctionnalité

1. Vérifier que la fonctionnalité existe et est active :
   ```python
   Feature.objects.get(name='feature-name', is_active=True)
   ```

2. Vérifier que le plan de l'utilisateur a accès :
   ```python
   user.tenant.subscription.plan in feature.available_plans.all()
   ```

3. Vérifier que l'utilisateur n'est pas super admin (les super admins ont toujours accès)

### Une fonctionnalité est disponible pour tous alors qu'elle ne devrait pas

1. Vérifier que `available_plans` n'est pas vide
2. Si `available_plans` est vide, la fonctionnalité est disponible pour tous (par design)
3. Ajouter les plans souhaités à `available_plans`

