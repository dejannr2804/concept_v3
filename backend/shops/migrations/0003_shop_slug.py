from django.db import migrations, models
import django.db.models
from django.utils.text import slugify


def populate_shop_slugs(apps, schema_editor):
    Shop = apps.get_model('shops', 'Shop')
    existing = set()

    # Preload existing slugs to avoid duplicates in case of partial data
    for s in Shop.objects.all().only('slug'):
        if s.slug:
            existing.add(s.slug)

    for shop in Shop.objects.all().only('id', 'name', 'slug'):
        if shop.slug:
            continue
        base = slugify(shop.name or '') or 'shop'
        candidate = base
        i = 2
        while candidate in existing:
            candidate = f"{base}-{i}"
            i += 1
        shop.slug = candidate
        shop.save(update_fields=['slug'])
        existing.add(candidate)


class Migration(migrations.Migration):
    dependencies = [
        ("shops", "0002_product"),
    ]

    operations = [
        migrations.AddField(
            model_name="shop",
            name="slug",
            field=models.SlugField(max_length=255, null=True, blank=True),
        ),
        migrations.RunPython(populate_shop_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="shop",
            name="slug",
            field=models.SlugField(max_length=255, unique=True),
        ),
    ]

