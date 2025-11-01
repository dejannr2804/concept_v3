import decimal
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('shops', '0014_alter_productvariantoption_id_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductInventoryItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sku', models.CharField(blank=True, default='', max_length=64)),
                ('option_values', models.JSONField(blank=True, default=dict)),
                ('option_key', models.CharField(blank=True, default='', max_length=255)),
                ('label', models.CharField(blank=True, default='', max_length=255)),
                ('price_override', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('stock_quantity', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('is_default', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='inventory_items', to='shops.product')),
            ],
            options={
                'db_table': 'cp_product_inventory_item',
                'ordering': ['product_id', 'id'],
            },
        ),
        migrations.AddConstraint(
            model_name='productinventoryitem',
            constraint=models.UniqueConstraint(fields=('product', 'option_key'), name='unique_inventory_combination_per_product'),
        ),
        migrations.CreateModel(
            name='Cart',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(default='', max_length=64, unique=True)),
                ('status', models.CharField(choices=[('active', 'Active'), ('converted', 'Converted'), ('abandoned', 'Abandoned')], default='active', max_length=16)),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('customer_name', models.CharField(blank=True, default='', max_length=255)),
                ('customer_email', models.EmailField(blank=True, default='', max_length=254)),
                ('customer_phone', models.CharField(blank=True, default='', max_length=32)),
                ('notes', models.TextField(blank=True, default='')),
                ('shipping_address', models.JSONField(blank=True, default=dict)),
                ('subtotal_amount', models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10)),
                ('total_items', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('shop', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='carts', to='shops.shop')),
            ],
            options={
                'db_table': 'cp_cart',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order_number', models.CharField(blank=True, default='', max_length=32, unique=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('paid', 'Paid'), ('fulfilled', 'Fulfilled'), ('cancelled', 'Cancelled'), ('refunded', 'Refunded')], default='pending', max_length=16)),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('subtotal_amount', models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10)),
                ('discount_amount', models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10)),
                ('tax_amount', models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10)),
                ('shipping_amount', models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10)),
                ('total_amount', models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10)),
                ('customer_name', models.CharField(blank=True, default='', max_length=255)),
                ('customer_email', models.EmailField(blank=True, default='', max_length=254)),
                ('customer_phone', models.CharField(blank=True, default='', max_length=32)),
                ('notes', models.TextField(blank=True, default='')),
                ('shipping_address', models.JSONField(blank=True, default=dict)),
                ('billing_address', models.JSONField(blank=True, default=dict)),
                ('placed_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cart', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order', to='shops.cart')),
                ('shop', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders', to='shops.shop')),
            ],
            options={
                'db_table': 'cp_order',
                'ordering': ['-placed_at'],
            },
        ),
        migrations.CreateModel(
            name='CartItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('product_name', models.CharField(max_length=255)),
                ('product_slug', models.SlugField(max_length=255)),
                ('sku', models.CharField(blank=True, default='', max_length=64)),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('option_values', models.JSONField(blank=True, default=dict)),
                ('option_label', models.CharField(blank=True, default='', max_length=255)),
                ('subtotal_amount', models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cart', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='shops.cart')),
                ('inventory_item', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='shops.productinventoryitem')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='+', to='shops.product')),
            ],
            options={
                'db_table': 'cp_cart_item',
                'ordering': ['cart_id', 'id'],
            },
        ),
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('product_name', models.CharField(max_length=255)),
                ('product_slug', models.SlugField(max_length=255)),
                ('sku', models.CharField(blank=True, default='', max_length=64)),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('option_values', models.JSONField(blank=True, default=dict)),
                ('option_label', models.CharField(blank=True, default='', max_length=255)),
                ('subtotal_amount', models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('inventory_item', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='shops.productinventoryitem')),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='shops.order')),
                ('product', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='shops.product')),
            ],
            options={
                'db_table': 'cp_order_item',
                'ordering': ['order_id', 'id'],
            },
        ),
    ]
