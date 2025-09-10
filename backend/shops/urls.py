from django.urls import path
from .views import (
    ShopListCreateView,
    ShopRetrieveUpdateDestroyView,
    ProductListCreateView,
    ProductRetrieveUpdateDestroyView,
    PublicShopDetailView,
    PublicProductDetailView,
    ProductImageUploadView,
    ProductImageDestroyView,
    ProductImageReorderView,
)

urlpatterns = [
    path('', ShopListCreateView.as_view(), name='shop-list-create'),
    path('slug/<slug:slug>/', PublicShopDetailView.as_view(), name='public-shop-detail'),
    path('slug/<slug:shop_slug>/products/<slug:product_slug>/', PublicProductDetailView.as_view(), name='public-product-detail'),
    path('<int:pk>/', ShopRetrieveUpdateDestroyView.as_view(), name='shop-detail'),
    path('<int:shop_id>/products/', ProductListCreateView.as_view(), name='product-list-create'),
    path('<int:shop_id>/products/<int:pk>/', ProductRetrieveUpdateDestroyView.as_view(), name='product-detail'),
    path('<int:shop_id>/products/<int:product_id>/images/upload/', ProductImageUploadView.as_view(), name='product-image-upload'),
    path('<int:shop_id>/products/<int:product_id>/images/<int:image_id>/', ProductImageDestroyView.as_view(), name='product-image-destroy'),
    path('<int:shop_id>/products/<int:product_id>/images/reorder/', ProductImageReorderView.as_view(), name='product-image-reorder'),
]
