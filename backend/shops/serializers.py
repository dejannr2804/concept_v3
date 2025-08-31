from rest_framework import serializers

from .models import Shop, Product


class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ["id", "name"]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "description", "shop", "created_at", "updated_at"]
        read_only_fields = ["shop", "created_at", "updated_at"]
