from django.contrib import admin

from .models import Shop, Product


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "user")
    search_fields = ("name", "slug")
    list_select_related = ("user",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "shop")
    search_fields = ("name",)
    list_select_related = ("shop",)
