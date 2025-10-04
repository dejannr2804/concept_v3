from django.contrib.auth.models import AbstractUser
from django.db import models
from .plan_limits import get_plan_features


class User(AbstractUser):
    class AccountType(models.TextChoices):
        FREE = "free", "Free"
        PRO = "pro", "Pro"
        ENTERPRISE = "enterprise", "Enterprise"

    email = models.EmailField(unique=True)
    profile_image_url = models.URLField(blank=True, null=True)
    account_type = models.CharField(
        max_length=20,
        choices=AccountType.choices,
        default=AccountType.FREE,
        help_text="Subscription tier controlling limits (defaults to free)",
    )

    def __str__(self) -> str:
        return self.username or self.email

    @property
    def max_shops_allowed(self) -> int | None:
        """
        Returns the maximum number of shops this user can create based on
        their account type. None means unlimited.
        """
        features = get_plan_features(self.account_type)
        return features.max_shops
