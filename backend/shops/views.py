from rest_framework import generics, permissions

from .models import Shop, Product
from .serializers import ShopSerializer, ProductSerializer


class ShopListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ShopSerializer

    def get_queryset(self):
        return Shop.objects.filter(user=self.request.user).order_by('id')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ShopRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ShopSerializer

    def get_queryset(self):
        # Limit access to shops owned by the current user
        return Shop.objects.filter(user=self.request.user)


class ProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProductSerializer

    def get_shop(self):
        return generics.get_object_or_404(Shop, pk=self.kwargs.get("shop_id"), user=self.request.user)

    def get_queryset(self):
        shop = self.get_shop()
        return Product.objects.filter(shop=shop).order_by("id")

    def perform_create(self, serializer):
        shop = self.get_shop()
        serializer.save(shop=shop)


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProductSerializer

    def get_queryset(self):
        # Constrain to products within the user's shops
        return Product.objects.filter(shop__user=self.request.user)
