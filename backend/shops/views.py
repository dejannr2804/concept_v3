from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import APIView

from .models import Shop, Product, ProductImage
from .serializers import ShopSerializer, ProductSerializer, PublicShopSerializer, PublicProductSerializer, ProductImageSerializer
from .spaces import upload_product_image, delete_product_image_by_url, SpacesConfigError


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


class PublicShopDetailView(RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicShopSerializer
    lookup_field = "slug"

    def get_queryset(self):
        # Publicly readable shop by slug, no user constraint
        return Shop.objects.all()


class PublicProductDetailView(RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicProductSerializer

    def get_object(self):
        shop_slug = self.kwargs.get("shop_slug")
        product_slug = self.kwargs.get("product_slug")
        return generics.get_object_or_404(Product, shop__slug=shop_slug, slug=product_slug)


class ProductImageUploadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, shop_id: int, product_id: int):
        # Validate ownership and product existence
        shop = generics.get_object_or_404(Shop, pk=shop_id, user=request.user)
        product = generics.get_object_or_404(Product, pk=product_id, shop=shop)

        file_obj = request.FILES.get("file") or request.FILES.get("image")
        if not file_obj:
            return Response({"detail": "Missing file under 'file' or 'image'"}, status=status.HTTP_400_BAD_REQUEST)

        alt_text = request.data.get("alt_text", "")
        try:
            url = upload_product_image(file_obj, getattr(file_obj, "name", "image"))
        except SpacesConfigError as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"detail": "Upload failed", "error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        image = ProductImage.objects.create(product=product, url=url, alt_text=alt_text)
        data = ProductImageSerializer(image).data
        return Response(data, status=status.HTTP_201_CREATED)


class ProductImageDestroyView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, shop_id: int, product_id: int, image_id: int):
        shop = generics.get_object_or_404(Shop, pk=shop_id, user=request.user)
        product = generics.get_object_or_404(Product, pk=product_id, shop=shop)
        image = generics.get_object_or_404(ProductImage, pk=image_id, product=product)
        # Best-effort delete from Spaces
        try:
            delete_product_image_by_url(image.url)
        except Exception:
            pass
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductImageReorderView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, shop_id: int, product_id: int):
        shop = generics.get_object_or_404(Shop, pk=shop_id, user=request.user)
        product = generics.get_object_or_404(Product, pk=product_id, shop=shop)
        order = request.data.get("order")
        if not isinstance(order, list) or not all(isinstance(x, int) for x in order):
            return Response({"detail": "Body must include 'order': [image_id, ...]"}, status=status.HTTP_400_BAD_REQUEST)
        # Constrain to product's images only
        imgs = list(ProductImage.objects.filter(product=product, id__in=order).only("id").values_list("id", flat=True))
        # Preserve only valid ids and set sort_order by index
        sort_map = {img_id: idx for idx, img_id in enumerate([i for i in order if i in imgs])}
        if not sort_map:
            return Response({"detail": "No valid images to reorder"}, status=status.HTTP_400_BAD_REQUEST)
        # Update in bulk
        to_update = []
        for img in ProductImage.objects.filter(product=product, id__in=sort_map.keys()).all():
            img.sort_order = sort_map[img.id]
            to_update.append(img)
        if to_update:
            ProductImage.objects.bulk_update(to_update, ["sort_order"]) 
        # Return updated list ordered by new sort_order then id
        images = ProductImage.objects.filter(product=product).order_by("sort_order", "id")
        data = ProductImageSerializer(images, many=True).data
        return Response(data, status=status.HTTP_200_OK)
