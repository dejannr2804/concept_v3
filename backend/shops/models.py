from django.conf import settings
from django.db import models


class Shop(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shops")

    class Meta:
        db_table = "cp_shop"
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.name} (owner={self.user_id})"

