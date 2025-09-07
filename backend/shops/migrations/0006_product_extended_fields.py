from django.db import migrations, models
import django.db.models.deletion
from django.utils.text import slugify


def populate_product_skus(apps, schema_editor):
    Product = apps.get_model('shops', 'Product')
    existing_per_shop = {}

    # Preload existing sku sets per shop (ignore nulls/empties)
    for p in Product.objects.all().only('shop_id', 'sku'):
        if getattr(p, 'sku', None):
            existing_per_shop.setdefault(p.shop_id, set()).add(p.sku)

    for p in Product.objects.all().only('id', 'shop_id', 'name', 'slug', 'sku'):
        if getattr(p, 'sku', None):
            continue
        base = (slugify(p.slug or p.name or '') or 'sku').upper().replace('-', '-')
        used = existing_per_shop.setdefault(p.shop_id, set())
        candidate = base
        i = 2
        while candidate in used:
            candidate = f"{base}-{i}"
            i += 1
        p.sku = candidate
        p.save(update_fields=['sku'])
        used.add(candidate)


class Migration(migrations.Migration):
    dependencies = [
        ("shops", "0005_product_slug"),
    ]

    operations = [
        # Rename description -> long_description to preserve data
        migrations.RenameField(
            model_name="product",
            old_name="description",
            new_name="long_description",
        ),

        # Add new fields
        migrations.AddField(
            model_name="product",
            name="short_description",
            field=models.CharField(max_length=512, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="product",
            name="sku",
            field=models.CharField(max_length=64, null=True, blank=True),
        ),
        migrations.AddField(
            model_name="product",
            name="category",
            field=models.CharField(max_length=255, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="product",
            name="status",
            field=models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active', max_length=16),
        ),
        migrations.AddField(
            model_name="product",
            name="base_price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="product",
            name="discounted_price",
            field=models.DecimalField(decimal_places=2, max_digits=10, null=True, blank=True),
        ),
        migrations.AddField(
            model_name="product",
            name="currency",
            field=models.CharField(default='USD', max_length=3),
        ),
        migrations.AddField(
            model_name="product",
            name="stock_quantity",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="product",
            name="stock_status",
            field=models.CharField(choices=[('in_stock', 'In stock'), ('out_of_stock', 'Out of stock')], default='in_stock', max_length=20),
        ),
        migrations.AddField(
            model_name="product",
            name="available_from",
            field=models.DateField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="product",
            name="available_to",
            field=models.DateField(null=True, blank=True),
        ),

        # Populate SKUs safely before enforcing NOT NULL + uniqueness
        migrations.RunPython(populate_product_skus, migrations.RunPython.noop),

        # Enforce NOT NULL for sku
        migrations.AlterField(
            model_name="product",
            name="sku",
            field=models.CharField(max_length=64),
        ),

        # Add uniqueness per shop for sku
        migrations.AddConstraint(
            model_name="product",
            constraint=models.UniqueConstraint(fields=["shop", "sku"], name="unique_sku_per_shop"),
        ),

        # Create ProductImage model
        migrations.CreateModel(
            name='ProductImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('url', models.URLField()),
                ('alt_text', models.CharField(blank=True, default='', max_length=255)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='shops.product')),
            ],
            options={
                'db_table': 'cp_product_image',
                'ordering': ['product_id', 'sort_order', 'id'],
            },
        ),
    ]
