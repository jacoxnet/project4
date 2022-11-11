import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from django.views.decorators.csrf import csrf_exempt

from network.models import User, Profile, Tweet



# 
# default route - 
#   returns all tweets and sends list to template
#
def index(request):
    return render(request, "network/index.html")


#
# route listtweets/listname
#      get list of tweets and return 
#      them 
#       "alltweets"
#       "mytweets"
#       "followingtweets"
#
def listtweets(request, tweetlist):
    if not request.user.is_authenticated:
        tweets = Tweet.objects.all()
    else:
        if tweetlist == "alltweets":
            tweets = Tweet.objects.all()
        elif tweetlist == "mytweets":
            tweets = Tweet.objects.filter(sender=request.user)
        elif tweetlist == "followingtweets":
            tweets = Tweet.objects.filter(userfollowing=request.user)
        else:
            return JsonResponse({"error": "Invalid tweetlist"}, status=400)
    # order tweets in reverse chron order
    tweets = tweets.order_by("-timestamp").all()
    return JsonResponse([tweet.serialize() for tweet in tweets], safe=False)

#
# route addtweet
#   add (post) new tweet
#
@csrf_exempt
@login_required
def addtweet(request):
    # must be a POST request
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)
    # load request body
    data = json.loads(request.body)
    # load body in request body
    body = data.get("body", "")
    sender = request.user
    newtweet = Tweet(sender=sender, body=body, likecount=0)
    newtweet.save()
    return JsonResponse({"message": "Tweet posted"}, status=201)

#
# route displayprofile/<profile>
#   display a user's profile
#
def displayprofile(request, username):
    # query for requested user
    try:
        theuser = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    theprofile = Profile.objects.get(user=theuser)
    return JsonResponse({
        "user": theuser,
        "follows": len(theprofile.follows),
        "isfollowedby": len(theuser.isfollowedby)
    })


    


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
