# Tests

## Structure des Tests

Les tests sont organisés par application :

- `backend-django/tests/` : Tests du backend Django
- `frontend/tests/` : Tests du frontend (à venir)

## Lancer les Tests

### Backend

```bash
cd backend-django
make test
```

Ou avec pytest directement :

```bash
pytest
```

Avec couverture :

```bash
pytest --cov=. --cov-report=html
```

### Frontend

```bash
cd frontend
npm test
```

## Écrire des Tests

### Backend (Django)

Utilisez pytest et pytest-django :

```python
import pytest
from pages.models import Page

@pytest.mark.django_db
def test_create_page():
    page = Page.objects.create(
        title="Test",
        slug="test"
    )
    assert page.title == "Test"
```

### Frontend (Next.js)

Utilisez Jest et React Testing Library :

```typescript
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

test('renders home page', () => {
  render(<Home />)
  expect(screen.getByText('CMS_CRM_SOLUTIONS')).toBeInTheDocument()
})
```

