# Generated by Django 4.0.4 on 2022-11-13 20:01

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0006_profile_description'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='tweet',
            name='likecount',
        ),
    ]