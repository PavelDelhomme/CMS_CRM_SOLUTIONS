"""
Authentication views - Login, register, logout
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.text import slugify
from django.conf import settings
from datetime import timedelta
import logging

from django.contrib.auth import get_user_model
from ..models import Client, Domain
from ..serializers import UserSerializer, UserRegisterSerializer, ClientSerializer
from .helpers import add_cors_headers

User = get_user_model()
logger = logging.getLogger(__name__)


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
        # Check user status and provide specific error messages
        # Vérifier si l'utilisateur a un attribut status (modèle personnalisé)
        user_status = getattr(user, 'status', None)
        if user_status == 'suspended':
            return Response(
                {
                    'error': 'Compte suspendu',
                    'detail': 'Votre compte a été suspendu. Veuillez contacter l\'administrateur.',
                    'status': 'suspended'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        elif user_status == 'inactive':
            return Response(
                {
                    'error': 'Compte désactivé',
                    'detail': 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.',
                    'status': 'inactive'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        elif not user.is_active:
            return Response(
                {
                    'error': 'Compte non actif',
                    'detail': 'Votre compte n\'est pas actif. Veuillez contacter l\'administrateur.',
                    'status': user.status
                },
                status=status.HTTP_403_FORBIDDEN
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
@permission_classes([AllowAny])
def register_with_plan_view(request):
    """
    Register a new tenant with a pricing plan and create admin user
    This is the public registration endpoint for new tenants
    """
    from django.utils.text import slugify
    from apps.billing.models import PricingPlan, Subscription
    from apps.tenants.models import Domain
    
    # Extract data
    tenant_name = request.data.get('tenant_name')
    tenant_email = request.data.get('email')
    password = request.data.get('password')
    plan_slug = request.data.get('plan_slug')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    billing_cycle = request.data.get('billing_cycle', 'monthly')  # monthly or yearly
    
    # Validation
    if not all([tenant_name, tenant_email, password, plan_slug]):
        return Response(
            {'error': 'Missing required fields: tenant_name, email, password, plan_slug'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if email already exists
    if User.objects.filter(email=tenant_email).exists():
        return Response(
            {'error': 'Un compte avec cet email existe déjà'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if tenant name/slug already exists
    tenant_slug = slugify(tenant_name)
    if Client.objects.filter(slug=tenant_slug).exists():
        return Response(
            {'error': 'Un tenant avec ce nom existe déjà. Veuillez choisir un autre nom.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get pricing plan
    try:
        pricing_plan = PricingPlan.objects.get(slug=plan_slug, is_active=True)
    except PricingPlan.DoesNotExist:
        return Response(
            {'error': 'Plan tarifaire introuvable ou inactif'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create tenant
        tenant = Client.objects.create(
            name=tenant_name,
            slug=tenant_slug,
            email=tenant_email,
            plan=plan_slug,
            status='trial',
            trial_ends_at=timezone.now() + timedelta(days=14)  # 14 days trial
        )
        
        # Create domain
        domain = Domain.objects.create(
            domain=f"{tenant_slug}.localhost",
            tenant=tenant,
            is_primary=True
        )
        
        # Create admin user for the tenant
        admin_username = f"admin_{tenant_slug}"
        admin_user = User.objects.create_user(
            username=admin_username,
            email=tenant_email,
            password=password,
            first_name=first_name or 'Admin',
            last_name=last_name or tenant_name,
            tenant=tenant,
            role='tenant-admin',
            status='active',
            is_active=True
        )
        
        # Assign permissions
        try:
            from .permissions import assign_role_permissions
            assign_role_permissions(admin_user, 'tenant-admin')
        except ImportError:
            pass
        
        # Create subscription with trial
        trial_start = timezone.now()
        trial_end = trial_start + timedelta(days=14)
        current_period_start = trial_start
        current_period_end = trial_end
        
        subscription = Subscription.objects.create(
            tenant=tenant,
            plan=pricing_plan,
            status='trial',
            billing_cycle=billing_cycle,
            trial_start=trial_start,
            trial_end=trial_end,
            current_period_start=current_period_start,
            current_period_end=current_period_end
        )
        
        # Create Stripe customer and setup intent for card registration
        setup_intent_client_secret = None
        try:
            from apps.billing.stripe_service import StripeService
            customer_id = StripeService.create_customer(tenant, tenant_email)
            subscription.stripe_customer_id = customer_id
            subscription.save(update_fields=['stripe_customer_id'])
            
            # Create setup intent for card registration (no charge during trial)
            setup_intent = StripeService.create_setup_intent(customer_id)
            setup_intent_client_secret = setup_intent['client_secret']
        except Exception as e:
            # Log error but don't fail registration
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error creating Stripe customer/setup intent: {e}")
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(admin_user)
        
        # Send welcome email
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:9494')
        tenant_url = f"http://{tenant_slug}.localhost:9494"
        admin_url = f"{tenant_url}/admin"
        
        try:
            send_mail(
                subject='Bienvenue sur VTCBuilder ! 🚀',
                message=f'''
Bonjour {admin_user.get_full_name() or admin_user.email},

Bienvenue sur VTCBuilder ! Votre compte a été créé avec succès.

Informations de votre compte :
- Nom du tenant : {tenant_name}
- Email : {tenant_email}
- Plan : {pricing_plan.name}
- Période d'essai : 14 jours (jusqu'au {trial_end.strftime("%d/%m/%Y")})

Accédez à votre administration :
{admin_url}

Votre site public sera disponible à :
{tenant_url}

Cordialement,
L'équipe VTCBuilder
                ''',
                html_message=f'''
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Bienvenue sur VTCBuilder ! 🚀</h2>
                    <p>Bonjour {admin_user.get_full_name() or admin_user.email},</p>
                    <p>Bienvenue sur VTCBuilder ! Votre compte a été créé avec succès.</p>
                    
                    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3>Informations de votre compte :</h3>
                        <ul>
                            <li><strong>Nom du tenant :</strong> {tenant_name}</li>
                            <li><strong>Email :</strong> {tenant_email}</li>
                            <li><strong>Plan :</strong> {pricing_plan.name}</li>
                            <li><strong>Période d'essai :</strong> 14 jours (jusqu'au {trial_end.strftime("%d/%m/%Y")})</li>
                        </ul>
                    </div>
                    
                    <p>
                        <a href="{admin_url}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Accéder à mon administration
                        </a>
                    </p>
                    
                    <p>Votre site public sera disponible à : <a href="{tenant_url}">{tenant_url}</a></p>
                    
                    <p>Cordialement,<br>L'équipe VTCBuilder</p>
                </body>
                </html>
                ''',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vtcbuilder.com'),
                recipient_list=[tenant_email],
                fail_silently=False,
            )
        except Exception as e:
            # Log error but don't fail registration
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error sending welcome email: {e}")
        
        return Response({
            'message': 'Inscription réussie ! Veuillez enregistrer votre carte bancaire pour continuer.',
            'user': UserSerializer(admin_user).data,
            'tenant': ClientSerializer(tenant).data,
            'subscription': {
                'id': subscription.id,
                'plan': pricing_plan.name,
                'status': 'trial',
                'trial_end': trial_end.isoformat(),
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'setup_intent_client_secret': setup_intent_client_secret,
            'subscription_id': subscription.id,
            'tenant_url': tenant_url,
            'admin_url': admin_url,
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error during tenant registration: {e}", exc_info=True)
        return Response(
            {'error': f'Erreur lors de la création du compte : {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
