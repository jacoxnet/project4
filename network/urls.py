
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("<int:page>", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("myfollows", views.myfollows, name="myfollows"),
    path("myfollows/<int:page>", views.myfollows, name="myfollows"),
    path("profile/<str:username>", views.profile, name="profile"),
    path("profile/<str:username>/<int:page>", views.profile, name="profile"),
    # api routes
    path("addtweet", views.addtweet, name="addtweet"),
    path("gettweet/<int:tweetid>", views.gettweet, name="gettweet"),
    path("changetweet", views.changetweet, name="changetweet"),
    path("togglefollow", views.togglefollow, name="togglefollow"),
    path("togglelike", views.togglelike, name="togglelike")
]
