#!/usr/bin/env python
"""
Script de test complet pour vérifier la configuration SMTP et envoyer un email réel
Usage: python test_email_smtp.py
"""

import os
import sys
import django
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtcbuilder.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail, get_connection

def test_smtp_connection():
    """Test connexion SMTP directe"""
    print("=" * 60)
    print("🔍 TEST CONNEXION SMTP DIRECTE")
    print("=" * 60)
    
    host = settings.EMAIL_HOST
    port = settings.EMAIL_PORT
    use_tls = settings.EMAIL_USE_TLS
    use_ssl = settings.EMAIL_USE_SSL
    username = settings.EMAIL_HOST_USER
    password = settings.EMAIL_HOST_PASSWORD
    
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"TLS: {use_tls}")
    print(f"SSL: {use_ssl}")
    print(f"Username: {username}")
    print(f"Password: {'*' * len(password) if password else 'NONE'}")
    print()
    
    try:
        if use_ssl:
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
        
        if use_tls and not use_ssl:
            server.starttls()
        
        if username and password:
            server.login(username, password)
            print("✅ Connexion SMTP réussie !")
            server.quit()
            return True
        else:
            print("⚠️ Pas de credentials fournis")
            server.quit()
            return False
            
    except Exception as e:
        print(f"❌ Erreur connexion SMTP: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_django_config():
    """Test configuration Django email"""
    print("\n" + "=" * 60)
    print("🔍 TEST CONFIGURATION DJANGO EMAIL")
    print("=" * 60)
    
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"EMAIL_HOST_PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NONE'}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"FRONTEND_URL: {settings.FRONTEND_URL}")
    print()
    
    # Vérifier si SMTP backend est utilisé
    if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        print("⚠️ ATTENTION: Le backend console est utilisé (emails affichés dans les logs)")
        print("   Les variables d'environnement ne sont peut-être pas chargées correctement")
        return False
    elif settings.EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
        print("✅ Backend SMTP configuré correctement")
        return True
    else:
        print(f"⚠️ Backend inattendu: {settings.EMAIL_BACKEND}")
        return False

def test_django_send():
    """Test envoi email via Django"""
    print("\n" + "=" * 60)
    print("📧 TEST ENVOI EMAIL VIA DJANGO")
    print("=" * 60)
    
    recipient = "test@delhomme.ovh"
    
    try:
        print(f"Envoi d'un email de test à {recipient}...")
        print()
        
        send_mail(
            subject='🧪 TEST EMAIL SMTP - VTCBuilder',
            message=f'''
Ceci est un email de TEST pour vérifier que la configuration SMTP fonctionne.

Si vous recevez cet email, c'est que la configuration SMTP est correcte !

Date: {settings.FRONTEND_URL}
Backend: {settings.EMAIL_BACKEND}
Host: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}

Cordialement,
L'équipe VTCBuilder
            ''',
            html_message=f'''
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>🧪 TEST EMAIL SMTP - VTCBuilder</h2>
                <p>Ceci est un email de <strong>TEST</strong> pour vérifier que la configuration SMTP fonctionne.</p>
                <p>Si vous recevez cet email, c'est que la configuration SMTP est <strong style="color: green;">CORRECTE</strong> !</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    Date: {settings.FRONTEND_URL}<br>
                    Backend: {settings.EMAIL_BACKEND}<br>
                    Host: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}
                </p>
                <p style="color: #666; font-size: 12px;">Cordialement,<br>L'équipe VTCBuilder</p>
            </body>
            </html>
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        
        print("✅ Email envoyé avec succès via Django !")
        print(f"📬 Vérifiez la boîte mail de {recipient}")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de l'email: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Fonction principale"""
    print("\n" + "=" * 60)
    print("🚀 TEST COMPLET CONFIGURATION EMAIL SMTP")
    print("=" * 60)
    print()
    
    # Test 1: Configuration Django
    config_ok = test_django_config()
    
    # Test 2: Connexion SMTP directe
    smtp_ok = test_smtp_connection()
    
    # Test 3: Envoi via Django
    if config_ok and smtp_ok:
        send_ok = test_django_send()
    else:
        print("\n⚠️ Impossible de tester l'envoi: configuration incorrecte")
        send_ok = False
    
    # Résumé
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    print(f"Configuration Django: {'✅ OK' if config_ok else '❌ ÉCHEC'}")
    print(f"Connexion SMTP: {'✅ OK' if smtp_ok else '❌ ÉCHEC'}")
    print(f"Envoi email: {'✅ OK' if send_ok else '❌ ÉCHEC'}")
    print()
    
    if not config_ok:
        print("💡 SOLUTION:")
        print("   1. Vérifier que les variables d'environnement sont définies dans docker-compose.simple.yml")
        print("   2. Redémarrer Docker: docker-compose -f docker-compose.simple.yml restart")
        print("   3. Vérifier les variables: docker-compose -f docker-compose.simple.yml exec backend env | grep EMAIL")
    
    return config_ok and smtp_ok and send_ok

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

