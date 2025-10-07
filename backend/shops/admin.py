from django.contrib import admin

from .models import Shop, Product, ProductImage, Category, ProductVariantType, ProductVariantOption
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


class ProductVariantOptionInline(admin.TabularInline):
    model = ProductVariantOption
    extra = 0
    fields = ("name", "value", "sort_order")


@admin.register(ProductVariantType)
class ProductVariantTypeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "product", "input_type", "sort_order")
    list_filter = ("input_type",)
    search_fields = ("name", "product__name", "product__sku")
    list_select_related = ("product",)
    inlines = [ProductVariantOptionInline]
    readonly_fields = ("input_type",)
    fields = ("product", "name", "input_type", "sort_order")


@admin.register(ProductVariantOption)
class ProductVariantOptionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "variant_type", "sort_order")
    list_select_related = ("variant_type", "variant_type__product")
    search_fields = ("name", "variant_type__name", "variant_type__product__name")
