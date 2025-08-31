from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shops", "0003_shop_slug"),
    ]

    operations = [
        migrations.AddField(
            model_name="shop",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
    ]

