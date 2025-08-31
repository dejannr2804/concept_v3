from rest_framework import serializers
from django.utils.text import slugify

from .models import Shop, Product


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


class PublicProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "description", "created_at", "updated_at"]


class PublicShopSerializer(serializers.ModelSerializer):
    products = PublicProductSerializer(many=True, read_only=True)

    class Meta:
        model = Shop
        fields = ["id", "name", "slug", "description", "products"]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "description", "shop", "created_at", "updated_at"]
        read_only_fields = ["shop", "created_at", "updated_at"]
