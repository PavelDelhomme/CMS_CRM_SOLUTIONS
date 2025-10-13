"""
API URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import views
from tenants.views import (
    TenantViewSet, UserViewSet, UserProfileView,
    login_view, register_view, logout_view
)
from pages.views import PageViewSet
from services.views import ServiceViewSet
from bookings.views import BookingViewSet
from media.views import MediaViewSet, TemplateViewSet
from .views import DashboardView

# Router for viewsets
router = DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'users', UserViewSet, basename='user')
router.register(r'pages', PageViewSet, basename='page')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'media', MediaViewSet, basename='media')
router.register(r'templates', TemplateViewSet, basename='template')

urlpatterns = [
    # Authentication
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/register/', register_view, name='register'),
    path('auth/me/', UserProfileView.as_view(), name='profile'),

    # Dashboard
    path('dashboard/', DashboardView.as_view(), name='dashboard'),

    # Include router URLs
    path('', include(router.urls)),
]

