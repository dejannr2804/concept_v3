from django.conf import settings
from django.db import models


class Shop(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shops")
    slug = models.SlugField(max_length=255, unique=True)

    class Meta:
        db_table = "cp_shop"
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.name} (owner={self.user_id})"


class Product(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cp_product"
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.name} (shop={self.shop_id})"
