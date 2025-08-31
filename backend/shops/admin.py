from django.contrib import admin

from .models import Shop


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "user")
    search_fields = ("name",)
    list_select_related = ("user",)

