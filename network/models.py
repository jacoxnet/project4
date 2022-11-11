from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Profile(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE)
    follows = models.ManyToManyField("User", related_name="isfollowedby")

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "follows": [user.username for user in self.following.all()]
        }

    def __str__(self):
        return str(self.serialize())

class Tweet(models.Model):
    sender = models.ForeignKey("User", on_delete=models.CASCADE)
    body = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField("User", related_name="userlikes", blank=True)
    likecount = models.IntegerField(default=0)

    def serialize(self):
        return {
            "id": self.id,
            "sender": self.sender.username,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes": [user.username for user in self.likes.all()],
            "likecount": self.likecount
        }
    def __str__(self):
        return str(self.serialize())