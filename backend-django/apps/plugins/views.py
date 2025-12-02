"""
Vues API pour la gestion des plugins et templates
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db import transaction

from .models import InstalledPlugin, Template, InstalledTemplate
from .serializers import InstalledPluginSerializer, TemplateSerializer, InstalledTemplateSerializer
from .manager import PluginManager
from apps.api.mixins import CORSMixin
from apps.api.utils import add_cors_headers

# Instance globale du gestionnaire de plugins
plugin_manager = PluginManager()


class InstalledPluginViewSet(CORSMixin, viewsets.ModelViewSet):
    """
    ViewSet pour gérer les plugins installés
    """
    queryset = InstalledPlugin.objects.all()
    serializer_class = InstalledPluginSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activer un plugin"""
        plugin = self.get_object()
        
        if plugin_manager.activate_plugin(plugin.name):
            plugin.enabled = True
            plugin.save()
            return Response({'status': 'activated'})
        return Response(
            {'error': 'Failed to activate plugin'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Désactiver un plugin"""
        plugin = self.get_object()
        
        if plugin_manager.deactivate_plugin(plugin.name):
            plugin.enabled = False
            plugin.save()
            return Response({'status': 'deactivated'})
        return Response(
            {'error': 'Failed to deactivate plugin'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Liste des plugins disponibles (chargés mais pas installés)"""
        all_plugins = plugin_manager.get_all_plugins()
        installed_names = set(
            InstalledPlugin.objects.values_list('name', flat=True)
        )
        
        available = []
        for name, plugin in all_plugins.items():
            if name not in installed_names:
                available.append({
                    'name': name,
                    'version': plugin.meta.version,
                    'description': plugin.meta.description,
                    'author': plugin.meta.author,
                })
        
        return Response(available)


class TemplateViewSet(CORSMixin, viewsets.ModelViewSet):
    """
    ViewSet pour gérer les templates
    """
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer selon le type et le statut"""
        queryset = Template.objects.all()
        
        template_type = self.request.query_params.get('type')
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        
        is_marketplace = self.request.query_params.get('marketplace')
        if is_marketplace == 'true':
            queryset = queryset.filter(is_marketplace=True, status='published')
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def install(self, request, pk=None):
        """Installer un template pour le tenant actuel"""
        template = self.get_object()
        user = request.user
        
        if not hasattr(user, 'tenant') or not user.tenant:
            return Response(
                {'error': 'User must be associated with a tenant'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier si déjà installé
        if InstalledTemplate.objects.filter(
            tenant=user.tenant,
            template=template
        ).exists():
            return Response(
                {'error': 'Template already installed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer l'installation
        installed = InstalledTemplate.objects.create(
            tenant=user.tenant,
            template=template,
            is_active=True
        )
        
        serializer = InstalledTemplateSerializer(installed)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def marketplace(self, request):
        """Templates disponibles sur la marketplace"""
        templates = Template.objects.filter(
            is_marketplace=True,
            status='published'
        ).order_by('-downloads', '-rating')
        
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)


class InstalledTemplateViewSet(CORSMixin, viewsets.ModelViewSet):
    """
    ViewSet pour gérer les templates installés
    """
    serializer_class = InstalledTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer par tenant de l'utilisateur"""
        user = self.request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            return InstalledTemplate.objects.filter(tenant=user.tenant)
        
        return InstalledTemplate.objects.none()

