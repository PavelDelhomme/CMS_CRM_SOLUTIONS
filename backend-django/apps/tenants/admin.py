from django.contrib import admin
from django_tenants.admin import TenantAdminMixin
from .models import Client, Domain


@admin.register(Client)
class ClientAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'schema_name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'schema_name')


admin.site.register(Domain)

