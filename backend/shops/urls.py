from django.urls import path
from .views import ShopListCreateView

urlpatterns = [
    path('', ShopListCreateView.as_view(), name='shop-list-create'),
]

