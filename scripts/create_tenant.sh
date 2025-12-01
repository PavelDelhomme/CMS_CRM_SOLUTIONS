#!/bin/bash

# Script pour créer un nouveau tenant

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./scripts/create_tenant.sh <nom> <domaine>"
    echo "Exemple: ./scripts/create_tenant.sh \"Mon Client\" \"client.example.com\""
    exit 1
fi

TENANT_NAME="$1"
TENANT_DOMAIN="$2"

cd backend-django

if [ ! -d "venv" ]; then
    echo "❌ Environnement virtuel non trouvé. Exécutez d'abord ./scripts/setup.sh"
    exit 1
fi

source venv/bin/activate

python manage.py shell << EOF
from tenants.models import Client, Domain

# Créer le client
client = Client.objects.create(
    name="$TENANT_NAME",
    schema_name="$TENANT_NAME".lower().replace(" ", "_"),
    is_active=True
)

# Créer le domaine
Domain.objects.create(
    domain="$TENANT_DOMAIN",
    tenant=client,
    is_primary=True
)

print(f"✅ Tenant créé: $TENANT_NAME ($TENANT_DOMAIN)")
EOF

cd ..

