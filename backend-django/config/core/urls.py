"""
URL configuration for CMS_CRM_SOLUTIONS
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
   openapi.Info(
      title="CMS_CRM_SOLUTIONS API",
      default_version='v1',
      description="API générique pour solutions CMS/CRM multi-tenant",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@cms-crm-solutions.com"),
      license=openapi.License(name="MIT License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Healthcheck endpoint (public, no auth required)
    path('health/', lambda request: JsonResponse({'status': 'ok', 'service': 'cms_crm_backend'}), name='health'),
    path('api/', include('apps.api.urls')),
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

