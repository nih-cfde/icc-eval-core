from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

# Register your models here.
from .models import ORCIDProjectMap, User, CoreProject, Repository, Analytics

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin to include ORCID field."""
    list_display = ['username', 'email', 'first_name', 'last_name', 'orcid', 'is_staff']
    list_filter = ['is_staff', 'is_superuser', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'orcid']
    
    # Add ORCID to the fieldsets
    fieldsets = BaseUserAdmin.fieldsets + (
        ('ORCID Information', {'fields': ('orcid',)}),
    )

@admin.register(CoreProject)
class CoreProjectAdmin(admin.ModelAdmin):
    pass

@admin.register(Repository)
class RepositoryAdmin(admin.ModelAdmin):
    pass

@admin.register(Analytics)
class AnalyticsAdmin(admin.ModelAdmin):
    # correctly pluralize the model name in the admin interface
    verbose_name_plural = "Analytics"

@admin.register(ORCIDProjectMap)
class ORCIDProjectMapAdmin(admin.ModelAdmin):
    pass
