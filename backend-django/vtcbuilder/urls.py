"""
CMS CRM Solutions URL Configuration (legacy - see config.core.urls)
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API
    path('api/', include('api.urls')),

    # Health check
    path('health/', lambda request: JsonResponse({'status': 'ok'})),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

