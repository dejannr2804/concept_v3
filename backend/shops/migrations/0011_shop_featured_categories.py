from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shops", "0010_shop_heading_cover_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="shop",
            name="featured_category_1",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='+', to='shops.category'),
        ),
        migrations.AddField(
            model_name="shop",
            name="featured_category_2",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='+', to='shops.category'),
        ),
        migrations.AddField(
            model_name="shop",
            name="featured_category_3",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='+', to='shops.category'),
        ),
    ]

