"""
API views for tenant models
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django_tenants.utils import tenant_context
from .models import Tenant, User
from .serializers import (
    TenantSerializer, UserSerializer, UserRegisterSerializer,
    UserProfileSerializer, DomainSerializer
)


class TenantViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tenants"""
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter tenants based on user role"""
        user = self.request.user
        if user.is_super_admin():
            return Tenant.objects.all()
        elif user.is_tenant_admin() and user.tenant:
            return Tenant.objects.filter(id=user.tenant.id)
        return Tenant.objects.none()

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a tenant"""
        tenant = self.get_object()
        tenant.status = 'active'
        tenant.save()
        return Response({'status': 'Tenant activated'})

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a tenant"""
        tenant = self.get_object()
        tenant.status = 'suspended'
        tenant.save()
        return Response({'status': 'Tenant suspended'})


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter users based on tenant context"""
        user = self.request.user
        if user.is_super_admin():
            return User.objects.all()
        elif user.tenant:
            return User.objects.filter(tenant=user.tenant)
        return User.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return UserRegisterSerializer
        return UserSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for user profile management"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login endpoint"""
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(email=email, password=password)

    if user:
        if not user.is_active_user():
            return Response(
                {'error': 'Account is not active'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })

    return Response(
        {'error': 'Invalid credentials'},
        status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """User registration endpoint"""
    serializer = UserRegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout endpoint"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logged out successfully'})
    except Exception:
        return Response({'message': 'Logged out successfully'})
