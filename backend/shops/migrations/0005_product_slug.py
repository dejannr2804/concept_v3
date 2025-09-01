from django.db import migrations, models
from django.utils.text import slugify


def populate_product_slugs(apps, schema_editor):
    Product = apps.get_model('shops', 'Product')
    existing_per_shop = {}

    # Build existing slug sets per shop
    for p in Product.objects.all().only('shop_id', 'slug'):
        if p.slug:
            existing_per_shop.setdefault(p.shop_id, set()).add(p.slug)

    for p in Product.objects.all().only('id', 'shop_id', 'name', 'slug'):
        if p.slug:
            continue
        base = slugify(p.name or '') or 'product'
        used = existing_per_shop.setdefault(p.shop_id, set())
        candidate = base
        i = 2
        while candidate in used:
            candidate = f"{base}-{i}"
            i += 1
        p.slug = candidate
        p.save(update_fields=['slug'])
        used.add(candidate)


class Migration(migrations.Migration):
    dependencies = [
        ("shops", "0004_shop_description"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="slug",
            field=models.SlugField(max_length=255, null=True, blank=True),
        ),
        migrations.RunPython(populate_product_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="product",
            name="slug",
            field=models.SlugField(max_length=255, null=False, blank=False),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.UniqueConstraint(fields=["shop", "slug"], name="unique_product_slug_per_shop"),
        ),
    ]

