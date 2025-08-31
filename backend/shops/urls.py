from django.urls import path
from .views import (
    ShopListCreateView,
    ShopRetrieveUpdateDestroyView,
    ProductListCreateView,
    ProductRetrieveUpdateDestroyView,
    PublicShopDetailView,
)

urlpatterns = [
    path('', ShopListCreateView.as_view(), name='shop-list-create'),
    path('slug/<slug:slug>/', PublicShopDetailView.as_view(), name='public-shop-detail'),
    path('<int:pk>/', ShopRetrieveUpdateDestroyView.as_view(), name='shop-detail'),
    path('<int:shop_id>/products/', ProductListCreateView.as_view(), name='product-list-create'),
    path('<int:shop_id>/products/<int:pk>/', ProductRetrieveUpdateDestroyView.as_view(), name='product-detail'),
]
