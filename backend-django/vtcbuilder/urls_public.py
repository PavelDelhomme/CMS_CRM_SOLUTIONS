"""
Public schema URL Configuration (for main domain)
"""
from django.urls import path, include
from django.http import JsonResponse

def home(request):
    return JsonResponse({
        'app': 'CMS CRM Solutions API',
        'version': '1.0.0',
        'message': 'Welcome to CMS CRM Solutions - Votre site professionnel, simplifié',
        'docs': '/api/docs',
    })

urlpatterns = [
    path('', home),
    path('api/', include('api.urls')),
]

