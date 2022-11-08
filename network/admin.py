from django.contrib import admin


# Register your models here.
from network.models import User, Profile, Tweet

admin.site.register(User)
admin.site.register(Profile)
admin.site.register(Tweet)