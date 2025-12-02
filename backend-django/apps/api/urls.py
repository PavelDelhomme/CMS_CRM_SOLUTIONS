"""
URLs de l'API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.tenants.views import login_view, register_view, UserViewSet, TenantViewSet
from apps.pages.views import PageViewSet
from apps.api.views import DashboardView

router = DefaultRouter()
router.register(r'pages', PageViewSet, basename='page')
router.register(r'users', UserViewSet, basename='user')
router.register(r'tenants', TenantViewSet, basename='tenant')
# URLs des plugins sont incluses via apps.plugins.urls

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/login/', login_view, name='login'),
    path('auth/register/', register_view, name='register'),
    path('stats/dashboard/', DashboardView.as_view(), name='dashboard'),
    # Système de plugins et templates
    path('', include('apps.plugins.urls')),
]

