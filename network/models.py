from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Profile(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE)
    following = models.ManyToManyField("User", related_name="userfollowing")

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "following": [user.username for user in self.following.all()]
        }

    def __str__(self):
        return str(self.serialize())

class Tweet(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE)
    body = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField("User", related_name="userlikes")

    def serialize(self):
        return {
            "id": self.id,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes": [user.username for user in self.likes.all()]
        }
    def __str__(self):
        return str(self.serialize())