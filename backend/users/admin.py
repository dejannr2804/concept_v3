from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from .forms import UserAdminForm


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserAdminForm

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            'Profile',
            {
                'fields': (
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
                'fields': ('profile_image_url',),
            },
        ),
    )
