from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from .forms import UserAdminForm


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserAdminForm
    list_display = ("username", "email", "account_type", "is_staff", "is_superuser")
    list_filter = ("account_type",) + BaseUserAdmin.list_filter

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            'Profile',
            {
                'fields': (
                    'account_type',
                    'profile_image_url',
                    'profile_image_file',
                )
            },
        ),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            'Profile',
            {
                'classes': ('wide',),
                'fields': ('account_type', 'profile_image_url',),
            },
        ),
    )
