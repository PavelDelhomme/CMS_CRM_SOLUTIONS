"""
WSGI config for CMS CRM Solutions project (legacy - use config.core.wsgi).
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.core.settings')

application = get_wsgi_application()

