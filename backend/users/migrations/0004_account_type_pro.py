from django.db import migrations, models


def migrate_paid_to_pro(apps, schema_editor):
    User = apps.get_model('users', 'User')
    # Update existing values from 'paid' to 'pro'
    User.objects.filter(account_type='paid').update(account_type='pro')


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_user_account_type"),
    ]

    operations = [
        migrations.RunPython(migrate_paid_to_pro, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="account_type",
            field=models.CharField(
                choices=[
                    ("free", "Free"),
                    ("pro", "Pro"),
                    ("enterprise", "Enterprise"),
                ],
                default="free",
                help_text="Subscription tier controlling limits (defaults to free)",
                max_length=20,
            ),
        ),
    ]

