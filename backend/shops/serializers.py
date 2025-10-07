from rest_framework import serializers
from django.utils.text import slugify

from .models import (
    Shop,
    Product,
    ProductImage,
    Category,
    ProductVariantType,
    ProductVariantOption,
)


class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = [
            "id",
            "name",
            "slug",
            "currency",
            "description",
            "heading",
            "profile_image_url",
            "cover_image_url",
            # Featured categories configurable in settings
            "featured_category_1",
            "featured_category_2",
            "featured_category_3",
        ]

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
        # Validate featured categories belong to this shop
        for key in ("featured_category_1", "featured_category_2", "featured_category_3"):
            cat = validated_data.get(key)
            if cat is not None:
                # Allow clearing by setting null
                if cat and hasattr(cat, "shop_id") and cat.shop_id != instance.id:
                    raise serializers.ValidationError({key: "Category must belong to this shop"})
        return super().update(instance, validated_data)


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt_text", "sort_order", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProductVariantOptionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = ProductVariantOption
        fields = ["id", "name", "value", "color_hex", "sort_order"]
        extra_kwargs = {
            "sort_order": {"required": False},
            "color_hex": {"required": False, "allow_blank": True},
        }

    def validate_name(self, value: str) -> str:
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Option name is required")
        return value


class ProductVariantTypeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    options = ProductVariantOptionSerializer(many=True, required=False)

    class Meta:
        model = ProductVariantType
        fields = ["id", "name", "input_type", "sort_order", "options"]
        extra_kwargs = {
            "sort_order": {"required": False},
            "input_type": {"read_only": True},
        }

    def validate_name(self, value: str) -> str:
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Variant name is required")
        return value


class PublicProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    # Back-compat alias for older clients
    description = serializers.CharField(source="long_description", read_only=True)
    category = serializers.CharField(source="category.name", read_only=True, allow_blank=True, default="")
    variant_types = ProductVariantTypeSerializer(many=True, read_only=True)

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
            "variant_types",
            "created_at",
            "updated_at",
        ]


class PublicShopSerializer(serializers.ModelSerializer):
    products = PublicProductSerializer(many=True, read_only=True)
    featured_categories = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = [
            "id",
            "name",
            "slug",
            "currency",
            "description",
            "heading",
            "profile_image_url",
            "cover_image_url",
            "products",
            "featured_categories",
        ]

    def get_featured_categories(self, obj: Shop):
        cats = []
        for cat in (getattr(obj, "featured_category_1", None), getattr(obj, "featured_category_2", None), getattr(obj, "featured_category_3", None)):
            if cat is not None:
                cats.append({"id": cat.id, "name": cat.name, "slug": cat.slug})
        return cats


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    # Back-compat alias for older clients
    description = serializers.CharField(source="long_description", read_only=True)
    # Represent category as a simple name for simplicity/back-compat (read-only display)
    category = serializers.CharField(source="category.name", read_only=True)
    variant_types = ProductVariantTypeSerializer(many=True, required=False)

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
            "variant_types",
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
            # Default product currency to the shop currency when not explicitly provided
            if not validated_data.get("currency") and getattr(shop, "currency", None):
                validated_data["currency"] = shop.currency
        variant_types_data = validated_data.pop("variant_types", [])
        product = super().create(validated_data)
        if variant_types_data:
            self._sync_variant_types(product=product, variant_types=variant_types_data)
        return product

    def update(self, instance, validated_data):
        if "slug" in validated_data and not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data.get("name", instance.name))
        # Update category from provided name if present
        if isinstance(self.initial_data, dict) and "category" in self.initial_data:
            cat_name = self.initial_data.get("category")
            validated_data["category"] = self._resolve_category(shop=instance.shop, name=cat_name)
        variant_types_data = validated_data.pop("variant_types", None)
        product = super().update(instance, validated_data)
        if variant_types_data is not None:
            self._sync_variant_types(product=product, variant_types=variant_types_data)
        return product

    def _sync_variant_types(self, *, product: Product, variant_types: list[dict]):
        if len(variant_types) > 3:
            raise serializers.ValidationError({"variant_types": "Up to three variant types are allowed per product"})

        existing_types = {vt.id: vt for vt in product.variant_types.all()}
        keep_type_ids: list[int] = []
        for index, variant_data in enumerate(variant_types):
            vt_id = variant_data.get("id")
            options_data = variant_data.get("options") or []
            name = (variant_data.get("name") or "").strip()
            input_type = ProductVariantType.InputType.TEXT
            if vt_id and vt_id in existing_types:
                vt = existing_types[vt_id]
                vt.name = name
                vt.input_type = input_type
                vt.sort_order = index
                vt.save(update_fields=["name", "input_type", "sort_order", "updated_at"])
            else:
                vt = ProductVariantType.objects.create(
                    product=product,
                    name=name,
                    input_type=input_type,
                    sort_order=index,
                )
            keep_type_ids.append(vt.id)
            self._sync_variant_options(variant_type=vt, options=options_data, input_type=input_type)

        ProductVariantType.objects.filter(product=product).exclude(id__in=keep_type_ids).delete()

    def _sync_variant_options(self, *, variant_type: ProductVariantType, options: list[dict], input_type: str):
        existing_options = {opt.id: opt for opt in variant_type.options.all()}
        keep_option_ids: list[int] = []
        for index, option_data in enumerate(options):
            opt_id = option_data.get("id")
            name = (option_data.get("name") or "").strip()
            value = option_data.get("value") or name
            color_hex = ""

            if opt_id and opt_id in existing_options:
                opt = existing_options[opt_id]
                opt.name = name
                opt.value = value
                opt.color_hex = color_hex
                opt.sort_order = index
                opt.save(update_fields=["name", "value", "color_hex", "sort_order"])
            else:
                opt = ProductVariantOption.objects.create(
                    variant_type=variant_type,
                    name=name,
                    value=value,
                    color_hex=color_hex,
                    sort_order=index,
                )
            keep_option_ids.append(opt.id)

        ProductVariantOption.objects.filter(variant_type=variant_type).exclude(id__in=keep_option_ids).delete()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "shop", "name", "slug", "description"]
        read_only_fields = ["shop"]
        extra_kwargs = {
            # Allow clients to omit slug; we'll generate from name
            "slug": {"required": False, "allow_blank": True},
        }

    def validate_slug(self, value: str) -> str:
        # Allow blank/missing slug; create() will generate from name
        value = (value or "").strip()
        if not value:
            return ""
        normalized = slugify(value)
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
