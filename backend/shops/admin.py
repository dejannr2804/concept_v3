from django.contrib import admin

from .models import Shop, Product, ProductImage, Category
from .forms import ProductImageAdminForm, ShopAdminForm


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    form = ShopAdminForm
    list_display = ("id", "name", "slug", "user")
    search_fields = ("name", "slug")
    list_select_related = ("user",)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    form = ProductImageAdminForm
    extra = 0
    fields = ("file", "alt_text", "sort_order", "url")
    readonly_fields = ("url",)
    ordering = ("sort_order", "id")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "sku", "status", "shop", "category")
    search_fields = ("name", "sku", "slug")
    list_filter = ("status", "currency")
    list_select_related = ("shop",)
    inlines = [ProductImageInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "shop")
    search_fields = ("name", "slug")
    list_select_related = ("shop",)
