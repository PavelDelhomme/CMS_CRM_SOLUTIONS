"""
Management command to create a password reset token for testing
Usage: python manage.py create_reset_token <email> [--token TOKEN]
"""
from django.core.management.base import BaseCommand, CommandError
from tenants.models import User, PasswordResetToken
from django.utils import timezone
from datetime import timedelta
from django.utils.crypto import get_random_string
from django.conf import settings


class Command(BaseCommand):
    help = 'Create a password reset token for a user (for testing)'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user')
        parser.add_argument(
            '--token',
            type=str,
            help='Custom token (optional, will be generated if not provided)',
            default=None
        )

    def handle(self, *args, **options):
        email = options['email']
        custom_token = options.get('token')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise CommandError(f'User with email "{email}" does not exist.')

        # Generate token if not provided
        if custom_token:
            token = custom_token
        else:
            token = get_random_string(length=64)

        expires_at = timezone.now() + timedelta(hours=24)

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
        reset_url_userid = f"{frontend_url}/reset-password?token={token}&userId={user.id}"

        self.stdout.write(
            self.style.SUCCESS(f'\n✅ Token créé avec succès pour {user.email}')
        )
        self.stdout.write(f'\n📋 Informations du token:')
        self.stdout.write(f'   - Token: {token}')
        self.stdout.write(f'   - Utilisateur: {user.email} (ID: {user.id})')
        self.stdout.write(f'   - Expire le: {expires_at.strftime("%Y-%m-%d %H:%M:%S")}')
        self.stdout.write(f'   - Valide: {reset_token.is_valid()}')
        self.stdout.write(f'\n🔗 URLs de test:')
        self.stdout.write(f'   - Avec email: {reset_url}')
        self.stdout.write(f'   - Avec userId: {reset_url_userid}')
        self.stdout.write(f'   - Token seul: {frontend_url}/reset-password?token={token}')
        self.stdout.write(f'\n💡 Note: Le token est valide pendant 24 heures.\n')

