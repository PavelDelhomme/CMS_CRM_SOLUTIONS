"""
Custom permissions that check user status
"""
from rest_framework import permissions


class IsActiveUser(permissions.BasePermission):
    """
    Permission to check if user is active (not suspended or inactive)
    """
    message = "Votre compte est suspendu ou désactivé. Veuillez contacter l'administrateur."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super admin can always access
        if request.user.is_super_admin():
            return True
        
        # Check user status
        return request.user.status == 'active'

