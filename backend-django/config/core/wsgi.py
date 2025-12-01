"""
WSGI config for CMS_CRM_SOLUTIONS project.
"""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.core.settings')

application = get_wsgi_application()

