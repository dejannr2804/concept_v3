from decimal import Decimal

from rest_framework import generics, permissions, status, serializers as drf_serializers
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import APIView

from .models import Shop, Product, ProductImage, Category, ProductInventoryItem, Cart, CartItem, Order, OrderItem
from django.db import transaction
from django.db.models import Max
from .serializers import (
    ShopSerializer,
    ProductSerializer,
    PublicShopSerializer,
    PublicProductSerializer,
    ProductImageSerializer,
    CategorySerializer,
    CartSerializer,
    CartAddItemSerializer,
    CartUpdateItemSerializer,
    CheckoutSerializer,
    OrderListSerializer,
    OrderDetailSerializer,
    OrderStatusSerializer,
    parse_variant_options,
)
from .spaces import upload_product_image, delete_product_image_by_url, SpacesConfigError, upload_shop_image
from users.plan_limits import get_plan_features


class ShopListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ShopSerializer

    def get_queryset(self):
        return Shop.objects.filter(user=self.request.user).order_by('id')

    def perform_create(self, serializer):
        user = self.request.user
        # Enforce plan-based shop limits (free: 1, pro: 5, enterprise: unlimited)
        try:
            max_allowed = getattr(user, "max_shops_allowed", None)
        except Exception:
            max_allowed = None
        if max_allowed is not None:
            current_count = Shop.objects.filter(user=user).count()
            if current_count >= max_allowed:
                plan = getattr(user, "account_type", "free")
                raise ValidationError({
                    "detail": f"Shop limit reached for your plan ('{plan}').",
                    "max_shops": max_allowed,
                })
        serializer.save(user=user)


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
        return (
            Product.objects.filter(shop=shop)
            .prefetch_related("images", "variant_types__options", "inventory_items")
            .order_by("id")
        )

    def perform_create(self, serializer):
        shop = self.get_shop()
        # Enforce plan-based product limits per shop
        try:
            features = get_plan_features(getattr(shop.user, "account_type", None))
            max_allowed = getattr(features, "max_products_per_shop", None)
        except Exception:
            max_allowed = None
        if max_allowed is not None:
            current_count = Product.objects.filter(shop=shop).count()
            if current_count >= max_allowed:
                plan = getattr(shop.user, "account_type", "free")
                raise ValidationError({
                    "detail": f"Product limit reached for your plan ('{plan}').",
                    "max_products": max_allowed,
                })
        serializer.save(shop=shop)


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProductSerializer

    def get_queryset(self):
        # Constrain to products within the user's shops
        return (
            Product.objects.filter(shop__user=self.request.user)
            .prefetch_related("images", "variant_types__options", "inventory_items")
        )


class PublicShopDetailView(RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicShopSerializer
    lookup_field = "slug"

    def get_queryset(self):
        # Publicly readable shop by slug, no user constraint
        return Shop.objects.prefetch_related(
            "products__images",
            "products__variant_types__options",
            "products__inventory_items",
        )


class PublicProductDetailView(RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicProductSerializer

    def get_object(self):
        shop_slug = self.kwargs.get("shop_slug")
        product_slug = self.kwargs.get("product_slug")
        return generics.get_object_or_404(
            Product.objects.prefetch_related("images", "variant_types__options", "inventory_items").select_related("category", "shop"),
            shop__slug=shop_slug,
            slug=product_slug,
        )


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

        # Append new image at the end (1-based sort_order)
        current_max = ProductImage.objects.filter(product=product).aggregate(m=Max("sort_order")).get("m") or 0
        image = ProductImage.objects.create(product=product, url=url, alt_text=alt_text, sort_order=current_max + 1)
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
        # Preserve only valid ids and set sort_order by index (1-based)
        sort_map = {img_id: (idx + 1) for idx, img_id in enumerate([i for i in order if i in imgs])}
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


class ShopProfileImageUploadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, shop_id: int):
        shop = generics.get_object_or_404(Shop, pk=shop_id, user=request.user)
        file_obj = request.FILES.get("file") or request.FILES.get("image")
        if not file_obj:
            return Response({"detail": "Missing file under 'file' or 'image'"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            url = upload_shop_image(file_obj, getattr(file_obj, "name", "image"))
        except SpacesConfigError as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"detail": "Upload failed", "error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        # Delete previous image best-effort
        prev = shop.profile_image_url
        if prev:
            try:
                from .spaces import delete_object_by_url
                delete_object_by_url(prev)
            except Exception:
                pass
        shop.profile_image_url = url
        shop.save(update_fields=["profile_image_url"]) 

        data = ShopSerializer(shop).data
        return Response({"shop": data}, status=status.HTTP_200_OK)


class ShopCoverImageUploadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, shop_id: int):
        shop = generics.get_object_or_404(Shop, pk=shop_id, user=request.user)
        file_obj = request.FILES.get("file") or request.FILES.get("image")
        if not file_obj:
            return Response({"detail": "Missing file under 'file' or 'image'"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            url = upload_shop_image(file_obj, getattr(file_obj, "name", "image"))
        except SpacesConfigError as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"detail": "Upload failed", "error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        # Delete previous cover image best-effort
        prev = shop.cover_image_url
        if prev:
            try:
                from .spaces import delete_object_by_url
                delete_object_by_url(prev)
            except Exception:
                pass
        shop.cover_image_url = url
        shop.save(update_fields=["cover_image_url"]) 

        data = ShopSerializer(shop).data
        return Response({"shop": data}, status=status.HTTP_200_OK)


class CategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CategorySerializer

    def get_shop(self):
        return generics.get_object_or_404(Shop, pk=self.kwargs.get("shop_id"), user=self.request.user)

    def get_queryset(self):
        shop = self.get_shop()
        return Category.objects.filter(shop=shop).order_by("id")

    def perform_create(self, serializer):
        shop = self.get_shop()
        serializer.save(shop=shop)


class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CategorySerializer

    def get_queryset(self):
        # Constrain to categories within the user's shops
        return Category.objects.filter(shop__user=self.request.user)


class CartViewMixin:
    cart_prefetch = (
        "items__product__images",
        "items__product__variant_types__options",
        "items__inventory_item",
    )

    def _load_cart(self, cart: Cart) -> Cart:
        return (
            Cart.objects.filter(pk=cart.pk)
            .select_related("shop")
            .prefetch_related(*self.cart_prefetch)
            .get()
        )

    def _get_or_create_cart(self, *, shop: Shop, token: str | None) -> Cart:
        cart: Cart | None = None
        if token:
            try:
                cart = Cart.objects.select_related("shop").get(token=token, shop=shop)
                if cart.status != Cart.Status.ACTIVE:
                    cart = None
            except Cart.DoesNotExist:
                cart = None
        if not cart:
            cart = Cart.objects.create(shop=shop, currency=shop.currency or "USD")
        return cart

    def _get_product(self, *, shop: Shop, data: dict) -> Product:
        product_id = data.get("product_id")
        product_slug = data.get("product_slug")
        qs = Product.objects.filter(shop=shop, status=Product.Status.ACTIVE).prefetch_related(
            "images",
            "variant_types__options",
            "inventory_items",
        )
        if product_id:
            product = generics.get_object_or_404(qs, pk=product_id)
        else:
            product = generics.get_object_or_404(qs, slug=product_slug)
        if product.stock_status == Product.StockStatus.OUT_OF_STOCK and not product.inventory_items.exists():
            raise ValidationError({"detail": "Product is out of stock"})
        return product

    def _resolve_inventory_item(self, *, product: Product, data: dict):
        inventory_item_id = data.get("inventory_item_id")
        options_payload = data.get("options")
        if inventory_item_id:
            inventory_item = generics.get_object_or_404(
                ProductInventoryItem.objects.filter(product=product), pk=inventory_item_id
            )
            if not inventory_item.is_active:
                raise ValidationError({"detail": "Selected variant is unavailable"})
            return inventory_item, inventory_item.option_values or {}, inventory_item.label
        if options_payload:
            try:
                option_values, option_label = parse_variant_options(product, options_payload)
            except drf_serializers.ValidationError as exc:
                raise ValidationError(exc.detail)
            option_key = ProductInventoryItem._build_option_key(option_values)
            inventory_item = product.inventory_items.filter(option_key=option_key, is_active=True).first()
            if inventory_item:
                return inventory_item, option_values, inventory_item.label or option_label
            if product.inventory_items.exists():
                raise ValidationError({"detail": "Selected variant combination is unavailable"})
            return None, option_values, option_label
        default_item = product.inventory_items.filter(is_active=True, is_default=True).first()
        if default_item:
            return default_item, default_item.option_values or {}, default_item.label
        solo_item = product.inventory_items.filter(is_active=True).first()
        if solo_item:
            return solo_item, solo_item.option_values or {}, solo_item.label
        return None, {}, ""

    def _find_existing_item(self, *, cart: Cart, product: Product, inventory_item: ProductInventoryItem | None):
        qs = cart.items.filter(product=product)
        if inventory_item:
            qs = qs.filter(inventory_item=inventory_item)
        else:
            qs = qs.filter(inventory_item__isnull=True)
        return qs.select_related("inventory_item", "product").first()

    def _determine_price(self, product: Product, inventory_item: ProductInventoryItem | None) -> Decimal:
        if inventory_item and inventory_item.price_override is not None:
            return inventory_item.price_override
        if product.discounted_price is not None:
            return product.discounted_price
        if product.base_price is not None:
            return product.base_price
        return Decimal("0")

    def _ensure_stock(self, *, product: Product, inventory_item: ProductInventoryItem | None, quantity: int):
        if product.stock_status == Product.StockStatus.OUT_OF_STOCK:
            raise ValidationError({"detail": "Product is out of stock"})
        if product.stock_status != Product.StockStatus.LIMITED:
            return
        if inventory_item:
            available = inventory_item.stock_quantity
            if quantity > available:
                if available <= 0:
                    raise ValidationError({"detail": "Selected variant is out of stock"})
                raise ValidationError({"detail": f"Only {available} left in stock"})
            return
        available = product.stock_quantity
        if quantity > available:
            if available <= 0:
                raise ValidationError({"detail": "Product is out of stock"})
            raise ValidationError({"detail": f"Only {available} left in stock"})


class CartAddItemView(CartViewMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, shop_slug: str):
        serializer = CartAddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        shop = generics.get_object_or_404(Shop, slug=shop_slug)
        with transaction.atomic():
            cart = self._get_or_create_cart(shop=shop, token=payload.get("cart_token"))
            product = self._get_product(shop=shop, data=payload)
            quantity = payload.get("quantity", 1)
            inventory_item, option_values, option_label = self._resolve_inventory_item(product=product, data=payload)
            existing_item = self._find_existing_item(cart=cart, product=product, inventory_item=inventory_item)
            target_quantity = quantity + (existing_item.quantity if existing_item else 0)
            self._ensure_stock(product=product, inventory_item=inventory_item, quantity=target_quantity)
            unit_price = self._determine_price(product, inventory_item)
            if existing_item:
                existing_item.quantity = target_quantity
                existing_item.unit_price = unit_price
                existing_item.inventory_item = inventory_item
                existing_item.option_values = option_values
                existing_item.option_label = option_label
                existing_item.currency = product.currency or cart.currency
                existing_item.save()
            else:
                CartItem.objects.create(
                    cart=cart,
                    product=product,
                    inventory_item=inventory_item,
                    product_name=product.name,
                    product_slug=product.slug,
                    sku=(inventory_item.sku if inventory_item and inventory_item.sku else product.sku),
                    quantity=quantity,
                    unit_price=unit_price,
                    currency=product.currency or cart.currency,
                    option_values=option_values,
                    option_label=option_label,
                )
            cart = self._load_cart(cart)
        status_code = status.HTTP_200_OK if existing_item else status.HTTP_201_CREATED
        return Response(CartSerializer(cart).data, status=status_code)


class CartRetrieveView(CartViewMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token: str):
        cart = generics.get_object_or_404(
            Cart.objects.select_related("shop"),
            token=token,
        )
        cart = self._load_cart(cart)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartItemUpdateView(CartViewMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, token: str, item_id: int):
        serializer = CartUpdateItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data["quantity"]
        with transaction.atomic():
            cart = generics.get_object_or_404(
                Cart.objects.select_related("shop").prefetch_related("items__product", "items__inventory_item"),
                token=token,
            )
            if cart.status != Cart.Status.ACTIVE:
                raise ValidationError({"detail": "Cart is not active"})
            try:
                item = cart.items.select_related("product", "inventory_item").get(pk=item_id)
            except CartItem.DoesNotExist:
                raise ValidationError({"detail": "Cart item not found"})
            self._ensure_stock(product=item.product, inventory_item=item.inventory_item, quantity=quantity)
            item.quantity = quantity
            item.save()
            cart = self._load_cart(cart)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    def delete(self, request, token: str, item_id: int):
        with transaction.atomic():
            cart = generics.get_object_or_404(
                Cart.objects.select_related("shop"),
                token=token,
            )
            if cart.status != Cart.Status.ACTIVE:
                raise ValidationError({"detail": "Cart is not active"})
            deleted, _ = CartItem.objects.filter(cart=cart, pk=item_id).delete()
            if not deleted:
                raise ValidationError({"detail": "Cart item not found"})
            cart = self._load_cart(cart)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartCheckoutView(CartViewMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, token: str):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        with transaction.atomic():
            cart = generics.get_object_or_404(
                Cart.objects.select_for_update()
                .select_related("shop")
                .prefetch_related(
                    "items__product__variant_types__options",
                    "items__product__images",
                    "items__inventory_item",
                ),
                token=token,
                status=Cart.Status.ACTIVE,
            )
            if cart.items.count() == 0:
                raise ValidationError({"detail": "Cart is empty"})
            order = self._create_order(cart=cart, payload=payload)
            cart.customer_name = payload.get("customer_name", "")
            cart.customer_email = payload.get("customer_email", "")
            cart.customer_phone = payload.get("customer_phone", "")
            cart.notes = payload.get("notes", "")
            cart.shipping_address = payload.get("shipping_address", {}) or {}
            cart.status = Cart.Status.CONVERTED
            cart.save(update_fields=["customer_name", "customer_email", "customer_phone", "notes", "shipping_address", "status", "updated_at"])
        order = Order.objects.filter(pk=order.pk).prefetch_related(
            "items__product__images",
            "items__product__variant_types__options",
        ).get()
        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)

    def _create_order(self, *, cart: Cart, payload: dict) -> Order:
        subtotal = Decimal("0")
        order = Order.objects.create(
            shop=cart.shop,
            cart=cart,
            currency=cart.currency or cart.shop.currency or "USD",
            customer_name=payload.get("customer_name", ""),
            customer_email=payload.get("customer_email", ""),
            customer_phone=payload.get("customer_phone", ""),
            notes=payload.get("notes", ""),
            shipping_address=payload.get("shipping_address", {}) or {},
            billing_address=payload.get("billing_address", {}) or {},
        )
        for item in cart.items.select_related("product", "inventory_item"):
            product = item.product
            inventory_item = item.inventory_item
            if product.stock_status == Product.StockStatus.OUT_OF_STOCK:
                raise ValidationError({"detail": f"{product.name} is out of stock"})
            if product.stock_status == Product.StockStatus.LIMITED:
                if inventory_item:
                    inventory_item = ProductInventoryItem.objects.select_for_update().get(pk=inventory_item.pk)
                    if inventory_item.stock_quantity < item.quantity:
                        raise ValidationError({"detail": f"{product.name} ({inventory_item.label}) is out of stock"})
                    inventory_item.stock_quantity = max(0, inventory_item.stock_quantity - item.quantity)
                    inventory_item.save()
                else:
                    product = Product.objects.select_for_update().get(pk=product.pk)
                    if product.stock_quantity < item.quantity:
                        raise ValidationError({"detail": f"{product.name} is out of stock"})
                    product.stock_quantity = max(0, product.stock_quantity - item.quantity)
                    product.stock_status = (
                        Product.StockStatus.LIMITED if product.stock_quantity > 0 else Product.StockStatus.OUT_OF_STOCK
                    )
                    product.save(update_fields=["stock_quantity", "stock_status", "updated_at"])
            OrderItem.objects.create(
                order=order,
                product=item.product,
                inventory_item=item.inventory_item,
                product_name=item.product_name,
                product_slug=item.product_slug,
                sku=item.sku,
                quantity=item.quantity,
                unit_price=item.unit_price,
                currency=item.currency,
                option_values=item.option_values,
                option_label=item.option_label,
            )
            subtotal += item.subtotal_amount
        order.subtotal_amount = subtotal
        order.total_amount = subtotal
        order.save(update_fields=["subtotal_amount", "total_amount", "updated_at"])
        return order


class OrderListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        shop = generics.get_object_or_404(Shop, pk=self.kwargs.get("shop_id"), user=self.request.user)
        return (
            Order.objects.filter(shop=shop)
            .select_related("shop")
            .prefetch_related("items")
            .order_by("-placed_at")
        )


class OrderDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        shop = generics.get_object_or_404(Shop, pk=self.kwargs.get("shop_id"), user=self.request.user)
        return (
            Order.objects.filter(shop=shop)
            .select_related("shop")
            .prefetch_related(
                "items__product__images",
                "items__product__variant_types__options",
                "items__inventory_item",
            )
        )

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return OrderStatusSerializer
        return super().get_serializer_class()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance=instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance.status = serializer.validated_data["status"]
        instance.save(update_fields=["status", "updated_at"])
        order = self.get_queryset().get(pk=instance.pk)
        detail = OrderDetailSerializer(order)
        return Response(detail.data, status=status.HTTP_200_OK)
