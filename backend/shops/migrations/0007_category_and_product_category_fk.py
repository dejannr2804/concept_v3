from django.db import migrations, models
import django.db.models.deletion
from django.utils.text import slugify


def migrate_categories_forward(apps, schema_editor):
    Product = apps.get_model('shops', 'Product')
    Category = apps.get_model('shops', 'Category')
    # Build per-shop name -> Category cache
    cache = {}

    def get_or_create_category(shop_id, name: str):
        if not name:
            return None
        key = (shop_id, name)
        if key in cache:
            return cache[key]
        slug = slugify(name) or 'category'
        obj, _ = Category.objects.get_or_create(shop_id=shop_id, name=name, defaults={'slug': slug})
        cache[key] = obj
        return obj

    # Iterate products and map previous category_name into FK
    for p in Product.objects.all().only('id', 'shop_id', 'category_name'):
        name = getattr(p, 'category_name', '') or ''
        cat = get_or_create_category(p.shop_id, name.strip())
        if cat:
            Product.objects.filter(id=p.id).update(category_id=cat.id)


class Migration(migrations.Migration):
    dependencies = [
        ("shops", "0006_product_extended_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('slug', models.SlugField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('shop', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='categories', to='shops.shop')),
            ],
            options={
                'db_table': 'cp_category',
                'ordering': ['id'],
            },
        ),
        migrations.AddConstraint(
            model_name='category',
            constraint=models.UniqueConstraint(fields=['shop', 'slug'], name='unique_category_slug_per_shop'),
        ),
        migrations.AddConstraint(
            model_name='category',
            constraint=models.UniqueConstraint(fields=['shop', 'name'], name='unique_category_name_per_shop'),
        ),

        # Rename old Product.category -> category_name temporarily
        migrations.RenameField(
            model_name='product',
            old_name='category',
            new_name='category_name',
        ),
        # Add new FK
        migrations.AddField(
            model_name='product',
            name='category',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='products', to='shops.category'),
        ),
        migrations.RunPython(migrate_categories_forward, migrations.RunPython.noop),
        # Drop old name field
        migrations.RemoveField(
            model_name='product',
            name='category_name',
        ),
    ]

