
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("myfollows", views.myfollows, name="myfollows"),
    path("profile/<str:username>", views.profile, name="profile"),
    # api routes
    path("addtweet", views.addtweet, name="addtweet"),
    path("listtweets/<str:tweetlist>", views.listtweets, name="listtweets"),
    path("displayprofile/<str:username>", views.displayprofile, name="displayprofile"),
    path("changetweet", views.changetweet, name="changetweet"),
    path("togglelike", views.togglelike, name="togglelike")
]
