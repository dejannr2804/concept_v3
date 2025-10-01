from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shops", "0011_shop_featured_categories"),
    ]

    operations = [
        migrations.AddField(
            model_name="shop",
            name="currency",
            field=models.CharField(max_length=3, default="USD"),
        ),
    ]

