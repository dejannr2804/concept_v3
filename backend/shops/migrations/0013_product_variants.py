from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shops", "0012_shop_currency"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductVariantType",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=64)),
                ("input_type", models.CharField(choices=[("text", "Text"), ("color", "Color")], default="text", max_length=16)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("product", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="variant_types", to="shops.product")),
            ],
            options={
                "db_table": "cp_product_variant_type",
                "ordering": ["product_id", "sort_order", "id"],
            },
        ),
        migrations.CreateModel(
            name="ProductVariantOption",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=64)),
                ("value", models.CharField(blank=True, default="", max_length=128)),
                ("color_hex", models.CharField(blank=True, default="", max_length=7)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("variant_type", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="options", to="shops.productvarianttype")),
            ],
            options={
                "db_table": "cp_product_variant_option",
                "ordering": ["variant_type_id", "sort_order", "id"],
            },
        ),
        migrations.AddConstraint(
            model_name="productvarianttype",
            constraint=models.UniqueConstraint(fields=("product", "name"), name="unique_variant_name_per_product"),
        ),
        migrations.AddConstraint(
            model_name="productvariantoption",
            constraint=models.UniqueConstraint(fields=("variant_type", "name"), name="unique_variant_option_name_per_variant"),
        ),
    ]

