from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_user_profile_image_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="account_type",
            field=models.CharField(
                choices=[
                    ("free", "Free"),
                    ("paid", "Paid"),
                    ("enterprise", "Enterprise"),
                ],
                default="free",
                help_text="Subscription tier controlling limits (defaults to free)",
                max_length=20,
            ),
        ),
    ]

