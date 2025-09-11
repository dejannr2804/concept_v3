from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shops', '0008_merge_20250907_1101'),
    ]

    operations = [
        migrations.AddField(
            model_name='shop',
            name='profile_image_url',
            field=models.URLField(blank=True, null=True),
        ),
    ]

