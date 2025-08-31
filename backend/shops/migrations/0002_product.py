from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("shops", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "shop",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="products", to="shops.shop"),
                ),
            ],
            options={
                "db_table": "cp_product",
                "ordering": ["id"],
            },
        ),
    ]

