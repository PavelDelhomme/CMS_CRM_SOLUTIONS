"""
Permissions configuration for VTCBuilder
"""
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from guardian.shortcuts import assign_perm, remove_perm
from .models import User, Tenant


# Permission codenames
PERMISSIONS = {
    # Tenant permissions
    'tenant': {
        'view': 'view_tenant',
        'add': 'add_tenant',
        'change': 'change_tenant',
        'delete': 'delete_tenant',
        'manage': 'manage_tenant',
    },

    # User permissions
    'user': {
        'view': 'view_user',
        'add': 'add_user',
        'change': 'change_user',
        'delete': 'delete_user',
        'manage': 'manage_user',
    },

    # Page permissions
    'page': {
        'view': 'view_page',
        'add': 'add_page',
        'change': 'change_page',
        'delete': 'delete_page',
        'publish': 'publish_page',
    },

    # Service permissions
    'service': {
        'view': 'view_service',
        'add': 'add_service',
        'change': 'change_service',
        'delete': 'delete_service',
        'manage': 'manage_service',
    },

    # Booking permissions
    'booking': {
        'view': 'view_booking',
        'add': 'add_booking',
        'change': 'change_booking',
        'delete': 'delete_booking',
        'manage': 'manage_booking',
    },

    # Media permissions
    'media': {
        'view': 'view_media',
        'add': 'add_media',
        'change': 'change_media',
        'delete': 'delete_media',
        'upload': 'upload_media',
    },

    # Template permissions
    'template': {
        'view': 'view_template',
        'add': 'add_template',
        'change': 'change_template',
        'delete': 'delete_template',
        'use': 'use_template',
    },
}

# Role definitions
ROLES = {
    'super-admin': {
        'name': 'Super Administrator',
        'description': 'Full system access',
        'permissions': [
            # All permissions
            'tenant.view_tenant', 'tenant.add_tenant', 'tenant.change_tenant', 'tenant.delete_tenant',
            'user.view_user', 'user.add_user', 'user.change_user', 'user.delete_user',
            'page.view_page', 'page.add_page', 'page.change_page', 'page.delete_page', 'page.publish_page',
            'service.view_service', 'service.add_service', 'service.change_service', 'service.delete_service',
            'booking.view_booking', 'booking.add_booking', 'booking.change_booking', 'booking.delete_booking',
            'media.view_media', 'media.add_media', 'media.change_media', 'media.delete_media',
            'template.view_template', 'template.add_template', 'template.change_template', 'template.delete_template',
        ]
    },

    'tenant-admin': {
        'name': 'Tenant Administrator',
        'description': 'Manage tenant-specific content',
        'permissions': [
            'user.view_user', 'user.add_user', 'user.change_user',
            'page.view_page', 'page.add_page', 'page.change_page', 'page.delete_page', 'page.publish_page',
            'service.view_service', 'service.add_service', 'service.change_service', 'service.delete_service',
            'booking.view_booking', 'booking.add_booking', 'booking.change_booking', 'booking.delete_booking',
            'media.view_media', 'media.add_media', 'media.change_media', 'media.delete_media',
            'template.view_template', 'template.use_template',
        ]
    },

    'driver': {
        'name': 'Driver',
        'description': 'Limited access for drivers',
        'permissions': [
            'booking.view_booking', 'booking.change_booking',
        ]
    },

    'operator': {
        'name': 'Operator',
        'description': 'Basic operational access',
        'permissions': [
            'booking.view_booking', 'booking.add_booking', 'booking.change_booking',
            'page.view_page',
            'service.view_service',
        ]
    },
}


def setup_permissions():
    """
    Setup default permissions and roles
    """
    from django.core.management import execute_from_command_line
    from django.db import connection

    # Create permissions for each model
    for app_label, perms in PERMISSIONS.items():
        for perm_name in perms.values():
            try:
                # Get the first content type for this app (in case there are duplicates)
                content_type = ContentType.objects.filter(app_label=app_label).first()
                if content_type:
                    Permission.objects.get_or_create(
                        codename=perm_name,
                        name=f'Can {perm_name.replace("_", " ")}',
                        content_type=content_type
                    )
            except Exception as e:
                print(f"Warning: Could not create permission {perm_name} for {app_label}: {e}")
                continue

    print("✅ Permissions configured")


def assign_role_permissions(user, role_name):
    """
    Assign permissions for a specific role to a user
    """
    if role_name not in ROLES:
        raise ValueError(f"Role '{role_name}' not found")

    role_config = ROLES[role_name]

    # Remove existing permissions
    user.user_permissions.clear()

    # Assign new permissions
    for perm_codename in role_config['permissions']:
        try:
            app_label, codename = perm_codename.split('.')
            # Get the first content type for this app
            content_type = ContentType.objects.filter(app_label=app_label).first()
            if content_type:
                permission = Permission.objects.get(
                    content_type=content_type,
                    codename=codename
                )
                user.user_permissions.add(permission)
        except (Permission.DoesNotExist, ContentType.DoesNotExist):
            print(f"Warning: Permission '{perm_codename}' not found")
            continue

    user.save()
    print(f"✅ Permissions assigned for role: {role_config['name']}")


def create_super_admin():
    """
    Create or update super admin user
    """
    try:
        super_admin = User.objects.get(email='admin@vtcbuilder.com')
        super_admin.role = 'super-admin'
        super_admin.is_staff = True
        super_admin.is_superuser = True
        super_admin.save()
    except User.DoesNotExist:
        super_admin = User.objects.create_superuser(
            username='superadmin',
            email='admin@vtcbuilder.com',
            password='admin123',
            first_name='Super',
            last_name='Admin',
            role='super-admin'
        )

    # Assign super admin permissions
    assign_role_permissions(super_admin, 'super-admin')

    print("✅ Super admin created/updated")


def create_tenant_admin(tenant, email='admin@tenant.local', password='admin123'):
    """
    Create tenant admin user
    """
    try:
        tenant_admin = User.objects.get(email=email)
        tenant_admin.tenant = tenant
        tenant_admin.role = 'tenant-admin'
        tenant_admin.save()
    except User.DoesNotExist:
        username = email.split('@')[0]  # Use email prefix as username
        tenant_admin = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name='Tenant',
            last_name='Admin',
            tenant=tenant,
            role='tenant-admin'
        )

    # Assign tenant admin permissions
    assign_role_permissions(tenant_admin, 'tenant-admin')

    print(f"✅ Tenant admin created for {tenant.name}")


def check_user_permissions(user, action, model_name):
    """
    Check if user has permission for specific action on model
    """
    if user.is_superuser:
        return True

    if user.role == 'super-admin':
        return True

    # Check specific permissions
    perm_codename = f'{model_name}.{action}_{model_name}'

    if user.has_perm(perm_codename):
        return True

    # Check for 'manage' permissions
    manage_perm = f'{model_name}.manage_{model_name}'
    if user.has_perm(manage_perm):
        return True

    return False


def can_access_tenant(user, tenant):
    """
    Check if user can access specific tenant
    """
    if user.is_superuser or user.role == 'super-admin':
        return True

    return user.tenant == tenant


def get_user_role_permissions(user):
    """
    Get all permissions for user's role
    """
    if user.role in ROLES:
        return ROLES[user.role]['permissions']
    return []
