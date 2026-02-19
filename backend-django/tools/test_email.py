#!/usr/bin/env python
"""
Script de test pour vérifier l'envoi d'emails SMTP
Usage: python test_email.py
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.core.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    """Test d'envoi d'email"""
    print("📧 Test d'envoi d'email SMTP")
    print("=" * 50)
    
    # Afficher la configuration
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print("=" * 50)
    
    recipient = "test@delhomme.ovh"
    
    try:
        print(f"\n📤 Envoi d'un email de test à {recipient}...")
        
        send_mail(
            subject='Test email CMS CRM Solutions - Réinitialisation mot de passe',
            message=f'''
Bonjour,

Ceci est un email de test pour vérifier la configuration SMTP de CMS CRM Solutions.

Si vous recevez cet email, la configuration SMTP fonctionne correctement !

Test réalisé à {settings.FRONTEND_URL}

Cordialement,
L'équipe CMS CRM Solutions
            ''',
            html_message=f'''
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Test email CMS CRM Solutions</h2>
                <p>Bonjour,</p>
                <p>Ceci est un email de test pour vérifier la configuration SMTP de CMS CRM Solutions.</p>
                <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement !</p>
                <hr>
                <p style="color: #666; font-size: 12px;">Test réalisé à {settings.FRONTEND_URL}</p>
                <p style="color: #666; font-size: 12px;">Cordialement,<br>L'équipe CMS CRM Solutions</p>
            </body>
            </html>
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        
        print("✅ Email envoyé avec succès !")
        print(f"📬 Vérifiez la boîte mail de {recipient}")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de l'email: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_email()
    sys.exit(0 if success else 1)

