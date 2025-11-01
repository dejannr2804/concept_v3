import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


class Shop(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shops")
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, default="")
    heading = models.CharField(max_length=255, blank=True, default="")
    profile_image_url = models.URLField(blank=True, null=True)
    cover_image_url = models.URLField(blank=True, null=True)
    currency = models.CharField(max_length=3, default="USD")
    # Up to three featured categories to highlight on public shop page
    featured_category_1 = models.ForeignKey(
        'Category', null=True, blank=True, on_delete=models.SET_NULL, related_name='+'
    )
    featured_category_2 = models.ForeignKey(
        'Category', null=True, blank=True, on_delete=models.SET_NULL, related_name='+'
    )
    featured_category_3 = models.ForeignKey(
        'Category', null=True, blank=True, on_delete=models.SET_NULL, related_name='+'
    )

    class Meta:
        db_table = "cp_shop"
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.name} (owner={self.user_id})"


class Category(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True, default="")

    class Meta:
        db_table = "cp_category"
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(fields=["shop", "slug"], name="unique_category_slug_per_shop"),
            models.UniqueConstraint(fields=["shop", "name"], name="unique_category_name_per_shop"),
        ]

    def __str__(self) -> str:
        return f"{self.name} (shop={self.shop_id})"


class Product(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)

    # Descriptions
    short_description = models.CharField(max_length=512, blank=True, default="")
    long_description = models.TextField(blank=True, default="")

    # Identification
    sku = models.CharField(max_length=64)
    category = models.ForeignKey('Category', null=True, blank=True, on_delete=models.SET_NULL, related_name='products')

    # Status
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

    # Pricing
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discounted_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="USD")

    # Availability
    stock_quantity = models.PositiveIntegerField(default=0)

    class StockStatus(models.TextChoices):
        IN_STOCK = "in_stock", "In stock"
        OUT_OF_STOCK = "out_of_stock", "Out of stock"

    stock_status = models.CharField(max_length=20, choices=StockStatus.choices, default=StockStatus.IN_STOCK)
    available_from = models.DateField(null=True, blank=True)
    available_to = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cp_product"
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(fields=["shop", "slug"], name="unique_product_slug_per_shop"),
            models.UniqueConstraint(fields=["shop", "sku"], name="unique_sku_per_shop"),
        ]

    def __str__(self) -> str:
        return f"{self.name} (shop={self.shop_id})"

    def build_variant_label(self, option_values: dict | None) -> str:
        if not option_values:
            return ""
        try:
            types = {str(vt.id): vt for vt in self.variant_types.prefetch_related("options")}
        except Exception:
            types = {str(vt.id): vt for vt in self.variant_types.all()}
        parts: list[str] = []
        for raw_key, raw_val in option_values.items():
            key = str(raw_key)
            try:
                value = int(raw_val)
            except (TypeError, ValueError):
                value = raw_val
            variant_type = types.get(key)
            if not variant_type:
                continue
            option = next((opt for opt in getattr(variant_type, "options", []).all() if opt.id == value), None)
            if not option:
                continue
            parts.append(f"{variant_type.name}: {option.name}")
        return " / ".join(parts)

    def refresh_inventory_snapshot(self):
        items = list(self.inventory_items.filter(is_active=True))
        if items:
            total = sum(item.stock_quantity for item in items)
            status = Product.StockStatus.IN_STOCK if total > 0 else Product.StockStatus.OUT_OF_STOCK
            fields = {"stock_quantity": total, "stock_status": status}
            for key, value in fields.items():
                setattr(self, key, value)
            self.save(update_fields=["stock_quantity", "stock_status", "updated_at"])
        else:
            # Preserve manual stock settings when no inventory records exist
            status = Product.StockStatus.IN_STOCK if self.stock_quantity > 0 else Product.StockStatus.OUT_OF_STOCK
            if status != self.stock_status:
                self.stock_status = status
                self.save(update_fields=["stock_status", "updated_at"])


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    url = models.URLField()
    alt_text = models.CharField(max_length=255, blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cp_product_image"
        ordering = ["product_id", "sort_order", "id"]

    def __str__(self) -> str:
        return f"Image {self.id} for product {self.product_id}"


class ProductVariantType(models.Model):
    class InputType(models.TextChoices):
        TEXT = "text", "Text"
        COLOR = "color", "Color"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variant_types")
    name = models.CharField(max_length=64)
    input_type = models.CharField(max_length=16, choices=InputType.choices, default=InputType.TEXT)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cp_product_variant_type"
        ordering = ["product_id", "sort_order", "id"]
        constraints = [
            models.UniqueConstraint(fields=["product", "name"], name="unique_variant_name_per_product"),
        ]

    def __str__(self) -> str:
        return f"VariantType {self.name} (product={self.product_id})"


class ProductVariantOption(models.Model):
    variant_type = models.ForeignKey(ProductVariantType, on_delete=models.CASCADE, related_name="options")
    name = models.CharField(max_length=64)
    value = models.CharField(max_length=128, blank=True, default="")
    color_hex = models.CharField(max_length=7, blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cp_product_variant_option"
        ordering = ["variant_type_id", "sort_order", "id"]
        constraints = [
            models.UniqueConstraint(fields=["variant_type", "name"], name="unique_variant_option_name_per_variant"),
        ]

    def __str__(self) -> str:
        return f"VariantOption {self.name} (variant_type={self.variant_type_id})"


class ProductInventoryItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="inventory_items")
    sku = models.CharField(max_length=64, blank=True, default="")
    option_values = models.JSONField(default=dict, blank=True)
    option_key = models.CharField(max_length=255, blank=True, default="")
    label = models.CharField(max_length=255, blank=True, default="")
    price_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cp_product_inventory_item"
        ordering = ["product_id", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "option_key"], name="unique_inventory_combination_per_product"
            ),
        ]

    def __str__(self) -> str:
        return f"InventoryItem {self.id} for product {self.product_id}"

    @staticmethod
    def _normalize_option_values(option_values):
        if not isinstance(option_values, dict):
            return {}
        normalized: dict[str, int] = {}
        for raw_key, raw_value in option_values.items():
            if raw_value in (None, "", []):
                continue
            try:
                key = str(int(raw_key))
                value = int(raw_value)
            except (TypeError, ValueError):
                # Fall back to string identifiers for flexibility
                key = str(raw_key)
                try:
                    value = int(raw_value)
                except (TypeError, ValueError):
                    value = raw_value
            normalized[key] = value
        return normalized

    @staticmethod
    def _build_option_key(option_values: dict[str, int | str]) -> str:
        if not option_values:
            return ""
        parts = []
        for key, value in option_values.items():
            if value in (None, ""):
                continue
            parts.append(f"{key}:{value}")
        parts.sort()
        return "|".join(parts)

    def save(self, *args, **kwargs):
        normalized = self._normalize_option_values(self.option_values or {})
        self.option_values = normalized
        self.option_key = self._build_option_key(normalized)
        if not self.option_key:
            # Ensure a default key so uniqueness constraint holds for base product stock row
            self.option_key = "default"
        self.label = self.product.build_variant_label(normalized)
        if self.price_override is not None:
            self.price_override = Decimal(self.price_override)
        if self.is_default:
            ProductInventoryItem.objects.filter(product=self.product, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)
        self.product.refresh_inventory_snapshot()

    def delete(self, *args, **kwargs):
        product = self.product
        super().delete(*args, **kwargs)
        product.refresh_inventory_snapshot()


class Cart(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CONVERTED = "converted", "Converted"
        ABANDONED = "abandoned", "Abandoned"

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="carts")
    token = models.CharField(max_length=64, unique=True, default="")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    currency = models.CharField(max_length=3, default="USD")
    customer_name = models.CharField(max_length=255, blank=True, default="")
    customer_email = models.EmailField(blank=True, default="")
    customer_phone = models.CharField(max_length=32, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    shipping_address = models.JSONField(default=dict, blank=True)
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_items = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cp_cart"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Cart {self.token} (shop={self.shop_id})"

    def ensure_token(self):
        if not self.token:
            self.token = uuid.uuid4().hex

    def save(self, *args, **kwargs):
        self.ensure_token()
        if self.subtotal_amount is not None:
            self.subtotal_amount = Decimal(self.subtotal_amount)
        super().save(*args, **kwargs)

    def recalculate(self, save: bool = True):
        items = list(self.items.all())
        subtotal = sum((item.subtotal_amount for item in items), Decimal("0"))
        total_items = sum(item.quantity for item in items)
        self.subtotal_amount = subtotal
        self.total_items = total_items
        if save:
            self.save(update_fields=["subtotal_amount", "total_items", "updated_at"])


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="+")
    inventory_item = models.ForeignKey(
        ProductInventoryItem, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    product_name = models.CharField(max_length=255)
    product_slug = models.SlugField(max_length=255)
    sku = models.CharField(max_length=64, blank=True, default="")
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    option_values = models.JSONField(default=dict, blank=True)
    option_label = models.CharField(max_length=255, blank=True, default="")
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cp_cart_item"
        ordering = ["cart_id", "id"]

    def __str__(self) -> str:
        return f"CartItem {self.id} (cart={self.cart_id})"

    def save(self, *args, **kwargs):
        if self.unit_price is not None:
            self.unit_price = Decimal(self.unit_price)
        self.subtotal_amount = (self.unit_price or Decimal("0")) * self.quantity
        super().save(*args, **kwargs)
        self.cart.recalculate()

    def delete(self, *args, **kwargs):
        cart = self.cart
        super().delete(*args, **kwargs)
        cart.recalculate()


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FULFILLED = "fulfilled", "Fulfilled"
        CANCELLED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="orders")
    cart = models.OneToOneField(Cart, on_delete=models.SET_NULL, null=True, blank=True, related_name="order")
    order_number = models.CharField(max_length=32, unique=True, blank=True, default="")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    currency = models.CharField(max_length=3, default="USD")
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    customer_name = models.CharField(max_length=255, blank=True, default="")
    customer_email = models.EmailField(blank=True, default="")
    customer_phone = models.CharField(max_length=32, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    shipping_address = models.JSONField(default=dict, blank=True)
    billing_address = models.JSONField(default=dict, blank=True)
    placed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cp_order"
        ordering = ["-placed_at"]

    def __str__(self) -> str:
        return f"Order {self.order_number} (shop={self.shop_id})"

    @staticmethod
    def generate_order_number() -> str:
        ts = timezone.now().strftime("%Y%m%d")
        suffix = uuid.uuid4().hex[:6].upper()
        return f"{ts}-{suffix}"

    def ensure_number(self):
        if not self.order_number:
            self.order_number = Order.generate_order_number()

    def save(self, *args, **kwargs):
        if self.subtotal_amount is not None:
            self.subtotal_amount = Decimal(self.subtotal_amount)
        if self.discount_amount is not None:
            self.discount_amount = Decimal(self.discount_amount)
        if self.tax_amount is not None:
            self.tax_amount = Decimal(self.tax_amount)
        if self.shipping_amount is not None:
            self.shipping_amount = Decimal(self.shipping_amount)
        if self.total_amount is not None:
            self.total_amount = Decimal(self.total_amount)
        self.ensure_number()
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    inventory_item = models.ForeignKey(
        ProductInventoryItem, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    product_name = models.CharField(max_length=255)
    product_slug = models.SlugField(max_length=255)
    sku = models.CharField(max_length=64, blank=True, default="")
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    option_values = models.JSONField(default=dict, blank=True)
    option_label = models.CharField(max_length=255, blank=True, default="")
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cp_order_item"
        ordering = ["order_id", "id"]

    def __str__(self) -> str:
        return f"OrderItem {self.id} (order={self.order_id})"

    def save(self, *args, **kwargs):
        if self.unit_price is not None:
            self.unit_price = Decimal(self.unit_price)
        self.subtotal_amount = (self.unit_price or Decimal("0")) * self.quantity
        super().save(*args, **kwargs)
