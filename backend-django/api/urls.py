"""
API URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import views
from tenants.views import (
    TenantViewSet, UserViewSet, UserProfileView,
    login_view, register_view, logout_view,
    request_password_reset_view, reset_password_view, verify_reset_token_view,
    verify_invitation_token_view, complete_invitation_view
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
    # Authentication (support both with and without trailing slash)
    path('auth/login', login_view, name='login'),
    path('auth/login/', login_view, name='login-slash'),
    path('auth/logout', logout_view, name='logout'),
    path('auth/logout/', logout_view, name='logout-slash'),
    path('auth/register', register_view, name='register'),
    path('auth/register/', register_view, name='register-slash'),
    path('auth/me', UserProfileView.as_view(), name='profile'),
    path('auth/me/', UserProfileView.as_view(), name='profile-slash'),
    path('auth/password-reset/request', request_password_reset_view, name='password-reset-request'),
    path('auth/password-reset/request/', request_password_reset_view, name='password-reset-request-slash'),
    path('auth/reset-password', reset_password_view, name='reset-password'),
    path('auth/reset-password/', reset_password_view, name='reset-password-slash'),
    path('auth/verify-reset-token', verify_reset_token_view, name='verify-reset-token'),
    path('auth/verify-reset-token/', verify_reset_token_view, name='verify-reset-token-slash'),
    path('auth/verify-invitation', verify_invitation_token_view, name='verify-invitation'),
    path('auth/verify-invitation/', verify_invitation_token_view, name='verify-invitation-slash'),
    path('auth/complete-invitation', complete_invitation_view, name='complete-invitation'),
    path('auth/complete-invitation/', complete_invitation_view, name='complete-invitation-slash'),

    # Dashboard
    path('dashboard/', DashboardView.as_view(), name='dashboard'),

    # Include router URLs
    path('', include(router.urls)),
]

