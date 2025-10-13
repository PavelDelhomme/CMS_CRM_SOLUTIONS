from django.contrib import admin
from django_tenants.admin import TenantAdminMixin
from .models import Tenant, Domain


@admin.register(Tenant)
class TenantAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['name', 'slug', 'email', 'plan', 'status', 'created_at']
    list_filter = ['plan', 'status', 'created_at']
    search_fields = ['name', 'email', 'slug']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ['domain', 'tenant', 'is_primary']
    list_filter = ['is_primary']
    search_fields = ['domain']

