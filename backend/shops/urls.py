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
    ShopProfileImageUploadView,
   ShopCoverImageUploadView,
    CategoryListCreateView,
    CategoryRetrieveUpdateDestroyView,
    CartAddItemView,
    CartRetrieveView,
    CartItemUpdateView,
    CartCheckoutView,
    OrderListView,
    OrderDetailView,
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
    path('<int:shop_id>/profile-image/', ShopProfileImageUploadView.as_view(), name='shop-profile-image'),
    path('<int:shop_id>/cover-image/', ShopCoverImageUploadView.as_view(), name='shop-cover-image'),
    # Categories
    path('<int:shop_id>/categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('<int:shop_id>/categories/<int:pk>/', CategoryRetrieveUpdateDestroyView.as_view(), name='category-detail'),
    # Carts
    path('slug/<slug:shop_slug>/cart/items/', CartAddItemView.as_view(), name='cart-add-item'),
    path('carts/<str:token>/', CartRetrieveView.as_view(), name='cart-detail'),
    path('carts/<str:token>/items/<int:item_id>/', CartItemUpdateView.as_view(), name='cart-item-update'),
    path('carts/<str:token>/checkout/', CartCheckoutView.as_view(), name='cart-checkout'),
    # Orders
    path('<int:shop_id>/orders/', OrderListView.as_view(), name='order-list'),
    path('<int:shop_id>/orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
