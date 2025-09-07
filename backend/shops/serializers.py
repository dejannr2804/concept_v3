from rest_framework import serializers
from django.utils.text import slugify

from .models import Shop, Product, ProductImage


class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ["id", "name", "slug", "description"]

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
        fields = ["id", "name", "slug", "description", "products"]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    # Back-compat alias for older clients
    description = serializers.CharField(source="long_description", read_only=True)
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

    def validate_slug(self, value: str) -> str:
        normalized = slugify(value or "")
        if not normalized:
            raise serializers.ValidationError("Slug cannot be empty")
        return normalized

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data.get("name", ""))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "slug" in validated_data and not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data.get("name", instance.name))
        return super().update(instance, validated_data)
