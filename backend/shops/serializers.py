from rest_framework import serializers
from django.utils.text import slugify

from .models import Shop, Product, ProductImage, Category


class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ["id", "name", "slug", "description", "profile_image_url"]

    def validate_slug(self, value: str) -> str:
        # Normalize slug to slug-case
        normalized = slugify(value or "")
        if not normalized:
            raise serializers.ValidationError("Slug cannot be empty")
        return normalized

    def create(self, validated_data):
        # Auto-suggest slug from name if not provided
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data.get("name", ""))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # If slug provided explicitly, normalize; if missing and name changed, leave slug as-is
        if "slug" in validated_data and not validated_data.get("slug"):
            # If empty string provided, regenerate based on name
            validated_data["slug"] = slugify(validated_data.get("name", instance.name))
        return super().update(instance, validated_data)


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt_text", "sort_order", "created_at"]
        read_only_fields = ["id", "created_at"]


class PublicProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    # Back-compat alias for older clients
    description = serializers.CharField(source="long_description", read_only=True)
    category = serializers.CharField(source="category.name", read_only=True, allow_blank=True, default="")
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "short_description",
            "long_description",
            "category",
            "status",
            "base_price",
            "discounted_price",
            "currency",
            "stock_quantity",
            "stock_status",
            "available_from",
            "available_to",
            "images",
            "created_at",
            "updated_at",
        ]


class PublicShopSerializer(serializers.ModelSerializer):
    products = PublicProductSerializer(many=True, read_only=True)

    class Meta:
        model = Shop
        fields = ["id", "name", "slug", "description", "profile_image_url", "products"]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    # Back-compat alias for older clients
    description = serializers.CharField(source="long_description", read_only=True)
    # Represent category as a simple name for simplicity/back-compat (read-only display)
    category = serializers.CharField(source="category.name", read_only=True)
    class Meta:
        model = Product
        fields = [
            "id",
            "shop",
            "name",
            "slug",
            "sku",
            "category",
            "description",
            "short_description",
            "long_description",
            "status",
            "base_price",
            "discounted_price",
            "currency",
            "stock_quantity",
            "stock_status",
            "available_from",
            "available_to",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["shop", "created_at", "updated_at", "images"]

    def _resolve_category(self, *, shop: Shop, name: str | None):
        name = (name or "").strip()
        if not name:
            return None
        # Find by name first; if missing, create with slug from name
        slug = slugify(name)
        # Ensure uniqueness per shop
        cat, _ = Category.objects.get_or_create(shop=shop, name=name, defaults={"slug": slug})
        return cat

    def validate_slug(self, value: str) -> str:
        normalized = slugify(value or "")
        if not normalized:
            raise serializers.ValidationError("Slug cannot be empty")
        return normalized

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data.get("name", ""))
        # Map category name to FK
        cat_name = self.initial_data.get("category") if isinstance(self.initial_data, dict) else None
        shop = validated_data.get("shop")
        if shop is not None:
            validated_data["category"] = self._resolve_category(shop=shop, name=cat_name)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "slug" in validated_data and not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data.get("name", instance.name))
        # Update category from provided name if present
        if isinstance(self.initial_data, dict) and "category" in self.initial_data:
            cat_name = self.initial_data.get("category")
            validated_data["category"] = self._resolve_category(shop=instance.shop, name=cat_name)
        return super().update(instance, validated_data)
