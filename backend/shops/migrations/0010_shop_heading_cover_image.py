from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shops", "0009_shop_profile_image_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="shop",
            name="heading",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="shop",
            name="cover_image_url",
            field=models.URLField(blank=True, null=True),
        ),
    ]

