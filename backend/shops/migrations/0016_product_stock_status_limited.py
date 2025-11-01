from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shops", "0015_ecommerce_models"),
    ]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="stock_status",
            field=models.CharField(
                choices=[
                    ("in_stock", "In stock"),
                    ("limited", "Limited stock"),
                    ("out_of_stock", "Out of stock"),
                ],
                default="in_stock",
                max_length=20,
            ),
        ),
    ]
