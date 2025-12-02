"""
URLs pour le système de plugins
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InstalledPluginViewSet, TemplateViewSet, InstalledTemplateViewSet

router = DefaultRouter()
router.register(r'plugins', InstalledPluginViewSet, basename='plugin')
router.register(r'templates', TemplateViewSet, basename='template')
router.register(r'installed-templates', InstalledTemplateViewSet, basename='installed-template')

urlpatterns = [
    path('', include(router.urls)),
]

