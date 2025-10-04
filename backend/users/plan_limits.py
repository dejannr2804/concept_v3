from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class PlanFeatures:
    """
    Centralized, extensible plan features/limits.

    Use None to denote "unlimited".
    """

    # Account-level limits
    max_shops: Optional[int] = None

    # Shop-level limits
    max_products_per_shop: Optional[int] = None

    # Future: add more limits here, e.g.:
    # max_categories_per_shop: Optional[int] = None
    # max_images_per_product: Optional[int] = None


# Default plan map. Keep keys aligned with users.models.User.AccountType values.
PLANS: dict[str, PlanFeatures] = {
    "free": PlanFeatures(
        max_shops=1,
        max_products_per_shop=20,
    ),
    "pro": PlanFeatures(
        max_shops=5,
        max_products_per_shop=100,
    ),
    "enterprise": PlanFeatures(
        max_shops=None,  # unlimited
        max_products_per_shop=None,  # unlimited
    ),
}


def get_plan_features(account_type: str | None) -> PlanFeatures:
    """
    Resolve features for a given account type. Unknown types default to
    enterprise-like unlimited to avoid unexpectedly downgrading capabilities.
    """
    if not account_type:
        return PLANS["free"]
    return PLANS.get(account_type, PlanFeatures())

