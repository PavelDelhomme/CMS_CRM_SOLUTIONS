"""
Public schema URL Configuration (for main domain)
"""
from django.urls import path, include
from django.http import JsonResponse

def home(request):
    return JsonResponse({
        'app': 'VTCBuilder API',
        'version': '1.0.0',
        'message': 'Welcome to VTCBuilder - Le WordPress des chauffeurs VTC',
        'docs': '/api/docs',
    })

urlpatterns = [
    path('', home),
    path('api/', include('api.urls')),
]

