from django.contrib import admin

from .models import Shop, Product, ProductImage


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "user")
    search_fields = ("name", "slug")
    list_select_related = ("user",)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    fields = ("url", "alt_text", "sort_order")
    ordering = ("sort_order", "id")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "sku", "status", "shop")
    search_fields = ("name", "sku", "slug")
    list_filter = ("status", "category", "currency")
    list_select_related = ("shop",)
    inlines = [ProductImageInline]
