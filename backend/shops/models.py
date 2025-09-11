from django.conf import settings
from django.db import models


class Shop(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shops")
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, default="")
    profile_image_url = models.URLField(blank=True, null=True)

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
