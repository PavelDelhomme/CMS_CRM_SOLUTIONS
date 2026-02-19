"""
ASGI config for CMS CRM Solutions project.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtcbuilder.settings')

application = get_asgi_application()

