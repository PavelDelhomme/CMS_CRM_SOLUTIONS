"""
Token management views - Password reset and invitation tokens
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.conf import settings
from datetime import timedelta
import logging

from django.contrib.auth import get_user_model
from ..models import PasswordResetToken, InvitationToken
from ..serializers import UserSerializer
from .helpers import add_cors_headers

User = get_user_model()
logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset_view(request):
    """
    Request password reset by email (public endpoint)
    User enters their email and receives a reset link
    """
    email = request.data.get('email')
    
    if not email:
        error_response = Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
        add_cors_headers(error_response, request)
        return error_response
    
    try:
        user = User.objects.get(email=email)
        
        # Generate token
        token = get_random_string(length=64)
        expires_at = timezone.now() + timedelta(hours=24)  # Token valid for 24 hours
        
        # Create or update reset token
        reset_token, created = PasswordResetToken.objects.update_or_create(
            user=user,
            used=False,
            defaults={
                'token': token,
                'expires_at': expires_at,
                'used': False,
            }
        )
        
        # Generate reset URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:9494')
        reset_url = f"{frontend_url}/reset-password?token={token}&email={user.email}"
        
        # Send email
        try:
            send_mail(
                subject='Réinitialisation de votre mot de passe - VTCBuilder',
                message=f'''
Bonjour {user.get_full_name() or user.email},

Vous avez demandé à réinitialiser votre mot de passe pour votre compte VTCBuilder.

Cliquez sur le lien suivant pour réinitialiser votre mot de passe (valable 24 heures) :
{reset_url}

Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.

Cordialement,
L'équipe VTCBuilder
                ''',
                html_message=f'''
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Réinitialisation de votre mot de passe</h2>
                    <p>Bonjour {user.get_full_name() or user.email},</p>
                    <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte VTCBuilder.</p>
                    <p>
                        <a href="{reset_url}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Réinitialiser mon mot de passe
                        </a>
                    </p>
                    <p>Ou copiez ce lien dans votre navigateur :</p>
                    <p style="word-break: break-all; color: #666;">{reset_url}</p>
                    <p><small>Ce lien est valable pendant 24 heures.</small></p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">Cordialement,<br>L'équipe VTCBuilder</p>
                </body>
                </html>
                ''',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vtcbuilder.com'),
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            # Always return success (security best practice - don't reveal if email exists)
            response = Response({
                'status': 'success',
                'message': 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
            })
            add_cors_headers(response, request)
            return response
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error sending password reset email: {str(e)}")
            # Still return success for security
            response = Response({
                'status': 'success',
                'message': 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
            })
            add_cors_headers(response, request)
            return response
            
    except User.DoesNotExist:
        # Don't reveal if email exists (security best practice)
        response = Response({
            'status': 'success',
            'message': 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
        })
        add_cors_headers(response, request)
        return response
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in request_password_reset_view: {e}", exc_info=True)
        response = Response({
            'status': 'success',
            'message': 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
        })
        add_cors_headers(response, request)
        return response


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    """
    Reset password using token from email
    Accepts either email or userId to find the user
    """
    try:
        token = request.data.get('token')
        email = request.data.get('email')
        userId = request.data.get('userId')
        new_password = request.data.get('password')

        if not token:
            error_response = Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            add_cors_headers(error_response, request)
            return error_response

        if not new_password:
            error_response = Response(
                {'error': 'Password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            add_cors_headers(error_response, request)
            return error_response

        user = None
        
        # Try to find user by email, userId, or token
        if email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                error_response = Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
                add_cors_headers(error_response, request)
                return error_response
        elif userId:
            try:
                user = User.objects.get(id=userId)
            except User.DoesNotExist:
                error_response = Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
                add_cors_headers(error_response, request)
                return error_response
        else:
            # If no email or userId, try to find by token only (token is unique)
            try:
                reset_token = PasswordResetToken.objects.get(token=token, used=False)
                user = reset_token.user
            except PasswordResetToken.DoesNotExist:
                error_response = Response(
                    {'error': 'Invalid token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                add_cors_headers(error_response, request)
                return error_response

        # Verify token for this user
        try:
            reset_token = PasswordResetToken.objects.get(
                user=user,
                token=token,
                used=False
            )

            if not reset_token.is_valid():
                error_response = Response(
                    {'error': 'Token expired or already used'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                add_cors_headers(error_response, request)
                return error_response

            # Validate password length
            if len(new_password) < 8:
                error_response = Response(
                    {'error': 'Password must be at least 8 characters long'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                add_cors_headers(error_response, request)
                return error_response

            # Set new password
            user.set_password(new_password)
            # Activate user if status is pending (password reset implies user wants to use the account)
            if user.status == 'pending':
                user.status = 'active'
            user.save()

            # Mark token as used
            reset_token.mark_as_used()

            response = Response({
                'status': 'Password reset successfully',
                'message': 'Votre mot de passe a été réinitialisé avec succès'
            })
            add_cors_headers(response, request)
            return response

        except PasswordResetToken.DoesNotExist:
            error_response = Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )
            add_cors_headers(error_response, request)
            return error_response

    except Exception as e:
        logger.error(f"Error in reset_password_view: {e}", exc_info=True)
        error_response = Response(
            {
                'error': 'An error occurred while resetting the password',
                'message': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        add_cors_headers(error_response, request)
        return error_response


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_token_view(request):
    """
    Verify if a reset token is valid (without resetting password)
    Accepts either email or userId to find the user
    """
    try:
        token = request.data.get('token')
        email = request.data.get('email')
        userId = request.data.get('userId')

        if not token:
            error_response = Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            add_cors_headers(error_response, request)
            return error_response

        user = None
        
        # Try to find user by email or userId
        if email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                error_response = Response({
                    'valid': False,
                    'error': 'User not found'
                })
                add_cors_headers(error_response, request)
                return error_response
        elif userId:
            try:
                user = User.objects.get(id=userId)
                email = user.email  # Set email for response
            except User.DoesNotExist:
                error_response = Response({
                    'valid': False,
                    'error': 'User not found'
                })
                add_cors_headers(error_response, request)
                return error_response
        else:
            # If no email or userId, try to find by token only (token is unique)
            try:
                reset_token = PasswordResetToken.objects.get(token=token, used=False)
                user = reset_token.user
                email = user.email
            except PasswordResetToken.DoesNotExist:
                error_response = Response({
                    'valid': False,
                    'error': 'Invalid token'
                })
                add_cors_headers(error_response, request)
                return error_response

        # Verify token for this user
        try:
            reset_token = PasswordResetToken.objects.get(
                user=user,
                token=token,
                used=False
            )

            is_valid = reset_token.is_valid()
            response_data = {
                'valid': is_valid,
                'email': email,
            }
            if is_valid:
                response_data['expires_at'] = reset_token.expires_at.isoformat()
            
            response = Response(response_data)
            add_cors_headers(response, request)
            return response

        except PasswordResetToken.DoesNotExist:
            error_response = Response({
                'valid': False,
                'error': 'Invalid token'
            })
            add_cors_headers(error_response, request)
            return error_response

    except Exception as e:
        logger.error(f"Error in verify_reset_token_view: {e}", exc_info=True)
        error_response = Response(
            {
                'valid': False,
                'error': 'An error occurred while verifying the token',
                'message': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        add_cors_headers(error_response, request)
        return error_response


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_invitation_token_view(request):
    """
    Verify if an invitation token is valid
    """
    token = request.data.get('token')
    email = request.data.get('email')

    if not token or not email:
        return Response(
            {'error': 'Token and email are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
        invitation_token = InvitationToken.objects.get(
            user=user,
            token=token,
            used=False
        )

        is_valid = invitation_token.is_valid()
        return Response({
            'valid': is_valid,
            'expires_at': invitation_token.expires_at.isoformat() if is_valid else None,
            'tenant': {
                'id': invitation_token.tenant.id,
                'name': invitation_token.tenant.name,
                'slug': invitation_token.tenant.slug,
            } if is_valid else None
        })

    except (User.DoesNotExist, InvitationToken.DoesNotExist):
        return Response({'valid': False})


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_invitation_view(request):
    """
    Complete invitation setup by setting password
    """
    token = request.data.get('token')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')

    if not token or not email or not password:
        return Response(
            {'error': 'Token, email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
        invitation_token = InvitationToken.objects.get(
            user=user,
            token=token,
            used=False
        )

        if not invitation_token.is_valid():
            return Response(
                {'error': 'Invitation expired or already used'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set password and update user info
        user.set_password(password)
        user.first_name = first_name
        user.last_name = last_name
        user.status = 'active'  # Activate user after setup
        user.save()

        # Mark invitation as used
        invitation_token.mark_as_used()

        # Generate tokens for immediate login
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'status': 'Account setup completed successfully',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })

    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except InvitationToken.DoesNotExist:
        return Response(
            {'error': 'Invalid invitation token'},
            status=status.HTTP_400_BAD_REQUEST
        )


