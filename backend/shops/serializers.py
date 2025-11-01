from decimal import Decimal, InvalidOperation

from rest_framework import serializers
from django.utils.text import slugify
from django.db.models import Sum

from .models import (
    Shop,
    Product,
    ProductImage,
    Category,
    ProductVariantType,
    ProductVariantOption,
    ProductInventoryItem,
    Cart,
    CartItem,
    Order,
    OrderItem,
)


def _variant_reference_maps(product: Product):
    variant_qs = product.variant_types.prefetch_related("options").all()
    type_map: dict[int, ProductVariantType] = {}
    option_map: dict[int, tuple[ProductVariantType, ProductVariantOption]] = {}
    for variant in variant_qs:
        type_map[variant.id] = variant
        for option in variant.options.all():
            option_map[option.id] = (variant, option)
    return type_map, option_map


def parse_variant_options(product: Product, options: list[dict]) -> tuple[dict[str, int], str]:
    if not options:
        return {}, ""
    if not isinstance(options, list):
        raise serializers.ValidationError({"options": "Expected a list of option entries"})

    type_map, option_map = _variant_reference_maps(product)
    normalized: dict[str, int] = {}
    seen_types: set[int] = set()

    for entry in options:
        if not isinstance(entry, dict):
            raise serializers.ValidationError({"options": "Each option must be an object"})
        type_id = entry.get("variant_type_id") or entry.get("type_id") or entry.get("variant_type")
        option_id = entry.get("variant_option_id") or entry.get("option_id") or entry.get("variant_option")
        try:
            type_id = int(type_id)
            option_id = int(option_id)
        except (TypeError, ValueError):
            raise serializers.ValidationError({"options": "Option and type identifiers must be integers"})
        if type_id not in type_map:
            raise serializers.ValidationError({"options": f"Variant type {type_id} does not exist for this product"})
        if option_id not in option_map:
            raise serializers.ValidationError({"options": f"Variant option {option_id} does not exist"})
        variant, option = option_map[option_id]
        if variant.id != type_id:
            raise serializers.ValidationError({"options": f"Variant option {option_id} does not belong to type {type_id}"})
        if type_id in seen_types:
            raise serializers.ValidationError({"options": "Duplicate variant type provided"})
        seen_types.add(type_id)
        normalized[str(type_id)] = option_id

    label = product.build_variant_label(normalized)
    return normalized, label


def serialize_variant_options(product: Product, option_values: dict | None) -> list[dict]:
    if not option_values:
        return []
    type_map, option_map = _variant_reference_maps(product)
    items: list[dict] = []
    for raw_type_id, raw_option_id in option_values.items():
        try:
            type_id = int(raw_type_id)
            option_id = int(raw_option_id)
        except (TypeError, ValueError):
            continue
        variant = type_map.get(type_id)
        option_pair = option_map.get(option_id)
        if not variant or not option_pair:
            continue
        option = option_pair[1]
        items.append({
            "variant_type_id": variant.id,
            "variant_type_name": variant.name,
            "variant_option_id": option.id,
            "variant_option_name": option.name,
            "sort_order": getattr(variant, "sort_order", 0),
        })
    items.sort(key=lambda item: item.get("sort_order", 0))
    for item in items:
        item.pop("sort_order", None)
    return items


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
    inventory_items = serializers.SerializerMethodField()

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
            "inventory_items",
            "created_at",
            "updated_at",
        ]

    def get_inventory_items(self, obj: Product):
        items = obj.inventory_items.filter(is_active=True)
        base_price = obj.discounted_price or obj.base_price or Decimal("0")
        data: list[dict] = []
        for item in items:
            price = item.price_override if item.price_override is not None else base_price
            data.append({
                "id": item.id,
                "sku": item.sku,
                "stock_quantity": item.stock_quantity,
                "is_default": item.is_default,
                "is_available": item.stock_quantity > 0 and item.is_active,
                "price": str(price),
                "currency": obj.currency,
                "option_label": item.label,
                "options": serialize_variant_options(obj, item.option_values),
            })
        return data


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
    inventory_items = serializers.SerializerMethodField()

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
            "inventory_items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["shop", "created_at", "updated_at", "images", "inventory_items"]

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
        inventory_payload = self._get_inventory_payload()
        if inventory_payload is not None:
            self._sync_inventory_items(product=product, payload=inventory_payload)
        if product.stock_status == Product.StockStatus.LIMITED:
            product.refresh_inventory_snapshot()
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
        inventory_payload = self._get_inventory_payload()
        if inventory_payload is not None:
            self._sync_inventory_items(product=product, payload=inventory_payload)
        product.refresh_inventory_snapshot()
        return product

    def get_inventory_items(self, obj: Product):
        items = obj.inventory_items.all()
        product_price = obj.discounted_price or obj.base_price
        data = []
        for item in items:
            override = item.price_override
            data.append({
                "id": item.id,
                "sku": item.sku,
                "stock_quantity": item.stock_quantity,
                "is_active": item.is_active,
                "is_default": item.is_default,
                "price_override": str(override) if override is not None else None,
                "calculated_price": str(override if override is not None else product_price or Decimal("0")),
                "option_label": item.label,
                "options": serialize_variant_options(obj, item.option_values),
            })
        return data

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

    def _get_inventory_payload(self):
        if not isinstance(self.initial_data, dict):
            return None
        if "inventory_items" not in self.initial_data:
            return None
        payload = self.initial_data.get("inventory_items")
        if payload in (None, ""):
            return []
        if isinstance(payload, list):
            return payload
        raise serializers.ValidationError({"inventory_items": "Must be a list"})

    def _normalize_inventory_payload(self, *, product: Product, payload: list[dict]):
        normalized: list[dict] = []
        seen_default = False
        for index, entry in enumerate(payload or []):
            if not isinstance(entry, dict):
                raise serializers.ValidationError({"inventory_items": f"Entry {index + 1} must be an object"})
            item_id = entry.get("id")
            if item_id is not None:
                try:
                    item_id = int(item_id)
                except (TypeError, ValueError):
                    raise serializers.ValidationError({"inventory_items": f"Entry {index + 1}: id must be numeric"})
            sku = (entry.get("sku") or "").strip()
            try:
                quantity = int(entry.get("stock_quantity", 0) or 0)
            except (TypeError, ValueError):
                raise serializers.ValidationError({"inventory_items": f"Entry {index + 1}: stock_quantity must be an integer"})
            if quantity < 0:
                raise serializers.ValidationError({"inventory_items": f"Entry {index + 1}: stock_quantity cannot be negative"})
            price_raw = entry.get("price_override", None)
            if price_raw in ("", None):
                price_override = None
            else:
                try:
                    price_override = Decimal(str(price_raw))
                except (InvalidOperation, TypeError, ValueError):
                    raise serializers.ValidationError({"inventory_items": f"Entry {index + 1}: price_override must be a number"})
                if price_override < Decimal("0"):
                    raise serializers.ValidationError({"inventory_items": f"Entry {index + 1}: price_override cannot be negative"})
            is_active = bool(entry.get("is_active", True))
            is_default = bool(entry.get("is_default", False))
            options_payload = entry.get("options") or []
            try:
                option_values, option_label = parse_variant_options(product, options_payload)
            except serializers.ValidationError as exc:
                raise serializers.ValidationError({"inventory_items": exc.detail}) from exc
            if is_default:
                seen_default = True
            normalized.append({
                "id": item_id,
                "sku": sku,
                "stock_quantity": quantity,
                "price_override": price_override,
                "is_active": is_active,
                "is_default": is_default,
                "option_values": option_values,
                "option_label": option_label,
            })
        if normalized and not seen_default:
            normalized[0]["is_default"] = True
        return normalized

    def _sync_inventory_items(self, *, product: Product, payload: list[dict]):
        normalized = self._normalize_inventory_payload(product=product, payload=payload)
        existing_items = {item.id: item for item in product.inventory_items.all()}
        keep_ids: list[int] = []
        for item_data in normalized:
            item_id = item_data.get("id")
            target = None
            if item_id is not None:
                target = existing_items.get(item_id)
                if target is None:
                    raise serializers.ValidationError({"inventory_items": f"Inventory item {item_id} does not exist"})
            fields = {
                "sku": item_data.get("sku") or product.sku,
                "stock_quantity": item_data.get("stock_quantity", 0),
                "price_override": item_data.get("price_override"),
                "is_active": item_data.get("is_active", True),
                "is_default": item_data.get("is_default", False),
            }
            option_values = item_data.get("option_values") or {}
            if target:
                target.option_values = option_values
                target.label = item_data.get("option_label", target.label)
                for key, value in fields.items():
                    setattr(target, key, value)
                target.save()
            else:
                target = ProductInventoryItem.objects.create(
                    product=product,
                    option_values=option_values,
                    label=item_data.get("option_label", ""),
                    **fields,
                )
            keep_ids.append(target.id)
        if keep_ids:
            product.inventory_items.exclude(id__in=keep_ids).delete()
        else:
            product.inventory_items.all().delete()
        product.refresh_inventory_snapshot()

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


class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_slug = serializers.CharField(read_only=True)
    product_name = serializers.CharField(read_only=True)
    product_image = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()
    inventory_item_id = serializers.IntegerField(source="inventory_item.id", read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product_id",
            "product_slug",
            "product_name",
            "sku",
            "quantity",
            "unit_price",
            "subtotal_amount",
            "currency",
            "option_label",
            "options",
            "product_image",
            "inventory_item_id",
        ]
        read_only_fields = fields

    def get_product_image(self, obj: CartItem):
        product = getattr(obj, "product", None)
        if not product:
            return None
        image = product.images.order_by("sort_order", "id").first()
        if not image:
            return None
        return {"id": image.id, "url": image.url, "alt_text": image.alt_text}

    def get_options(self, obj: CartItem):
        product = getattr(obj, "product", None)
        if not product:
            return []
        return serialize_variant_options(product, obj.option_values)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    shop_slug = serializers.CharField(source="shop.slug", read_only=True)

    class Meta:
        model = Cart
        fields = [
            "token",
            "status",
            "shop_slug",
            "currency",
            "subtotal_amount",
            "total_items",
            "customer_name",
            "customer_email",
            "customer_phone",
            "notes",
            "shipping_address",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "token",
            "status",
            "subtotal_amount",
            "total_items",
            "items",
            "created_at",
            "updated_at",
            "shop_slug",
            "currency",
        ]


class CartAddItemSerializer(serializers.Serializer):
    cart_token = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    product_id = serializers.IntegerField(required=False)
    product_slug = serializers.CharField(required=False)
    quantity = serializers.IntegerField(min_value=1, default=1)
    inventory_item_id = serializers.IntegerField(required=False, allow_null=True)
    options = serializers.ListField(child=serializers.DictField(), required=False)

    def validate(self, attrs):
        product_id = attrs.get("product_id")
        product_slug = attrs.get("product_slug")
        if not product_id and not product_slug:
            raise serializers.ValidationError("Provide product_id or product_slug")
        return attrs


class CartUpdateItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)


class CheckoutSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=255)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=32, allow_blank=True, required=False)
    notes = serializers.CharField(allow_blank=True, required=False)
    shipping_address = serializers.DictField(child=serializers.CharField(allow_blank=True), required=False)
    billing_address = serializers.DictField(child=serializers.CharField(allow_blank=True), required=False)


class OrderItemSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    inventory_item_id = serializers.IntegerField(source="inventory_item.id", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_name",
            "product_slug",
            "sku",
            "quantity",
            "unit_price",
            "subtotal_amount",
            "currency",
            "option_label",
            "options",
            "product_image",
            "inventory_item_id",
        ]
        read_only_fields = fields

    def get_options(self, obj: OrderItem):
        product = getattr(obj, "product", None)
        if not product:
            return []
        return serialize_variant_options(product, obj.option_values)

    def get_product_image(self, obj: OrderItem):
        product = getattr(obj, "product", None)
        if not product:
            return None
        image = product.images.order_by("sort_order", "id").first()
        if not image:
            return None
        return {"id": image.id, "url": image.url, "alt_text": image.alt_text}


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "currency",
            "subtotal_amount",
            "discount_amount",
            "tax_amount",
            "shipping_amount",
            "total_amount",
            "customer_name",
            "customer_email",
            "placed_at",
            "item_count",
        ]

    def get_item_count(self, obj: Order):
        return obj.items.aggregate(total=Sum("quantity")).get("total") or 0


class OrderDetailSerializer(OrderListSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    notes = serializers.CharField(read_only=True)
    shipping_address = serializers.JSONField(read_only=True)
    billing_address = serializers.JSONField(read_only=True)
    customer_phone = serializers.CharField(read_only=True)

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + [
            "notes",
            "shipping_address",
            "billing_address",
            "customer_phone",
            "items",
        ]


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]
