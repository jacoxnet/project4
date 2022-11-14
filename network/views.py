import json
from functools import reduce

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
    showprofile = False
    listname = "All Posts"
    tweetlist = Tweet.objects.all()
    if request.user.is_authenticated:
        showinput = True
    else:
        showinput = False
    tweetlist = tweetlist.order_by("-timestamp").all()
    context = {
        "showinput": showinput,
        "showprofile": showprofile,
        "listname": listname,
        "tweetlist": [tweet.serialize() for tweet in tweetlist]
    }
    return render(request, "network/index.html", context)

#
# route /profile/<str:username>
#
def profile(request, username):
    try:
        theuser = User.objects.get(username=username)
    except User.DoesNotExist:
        return render(request, "network/index.html", {
                "message": "Invalid username."
            })
    # get the user's tweets
    tweetlist = Tweet.objects.filter(sender=theuser)
    # order tweets in reverse chron order
    tweetlist = tweetlist.order_by("-timestamp").all()
    if request.user.is_authenticated:
        showinput = True
    else:
        showinput = False
    showprofile = True
    listname = "@" + username + "'s posts"
    # query for user's profile - create if necessary
    try: 
        theprofile = Profile.objects.get(user=theuser)
    except Profile.DoesNotExist:
        # create new profile
        theprofile = Profile(user=theuser, description="Hi, I'm " + "@" + theuser.username + "! Welcome to my page.")
        theprofile.save()
    context = {
        "showinput": showinput,
        "showprofile": showprofile,
        "listname": listname,
        "profile": theprofile.serialize(),
        "tweetlist": [tweet.serialize() for tweet in tweetlist]
    }
    return render(request, "network/index.html", context)


# 
# route /myfollows
#       show tweets of people the logged-in user follows
#       
@login_required
def myfollows(request):    
    showinput = True
    showprofile = False
    listname = listname = "@" + request.user.username + "'s followers posts"
    # get current user's profile
    theprofile = Profile.objects.get(user=request.user)
    # get queryset with the user's follows
    thefollows = theprofile.follows.all()
    # get an iterable with each users tweets
    theiterable = list(map(lambda a:Tweet.objects.filter(sender=a), thefollows))
    if len(theiterable) > 0:
        # union all these tweets together
        tweets = reduce(lambda a, b: a|b, theiterable)
    else:
        # create empty queryset
        tweets = Tweet.objects.filter(sender=None);
    tweetlist = tweets.order_by("-timestamp").all()
    context = {
        "showinput": showinput,
        "showprofile": showprofile,
        "listname": listname,
        "tweetlist": [tweet.serialize() for tweet in tweetlist]
    }
    return render(request, "network/index.html", context)

#
# route listtweets/tweetlist
#      get list of tweets and return 
#      them 
#       "alltweets" 
#       "myfollows" (logged in user's follows)
#       <username> (tweets of that username)
#
def listtweets(request, tweetlist):
    if tweetlist == "alltweets":
        tweets = Tweet.objects.all()
    elif tweetlist == "myfollows":
        # cannot show follows if not logged in
        if not request.user.is_authenticated:
            return JsonResponse({"error": "User not found"}, status=404)
        theuser = request.user
        # get that user's profile
        theprofile = Profile.objects.get(user=theuser)
        # get queryset with the user's follows
        thefollows = theprofile.follows.all()
        # get an iterable with each users tweets
        theiterable = list(map(lambda a:Tweet.objects.filter(sender=a), thefollows))
        if len(theiterable) > 0:
            # union all these tweets together
            tweets = reduce(lambda a, b: a|b, theiterable)
        else:
            # create empty queryset
            tweets = Tweet.objects.filter(sender=None);
    else:
        # treat tweetlist as a username
        # look up user from username
        try:
            theuser = User.objects.get(username=tweetlist)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        # get the user's tweets
        tweets = Tweet.objects.filter(sender=theuser)
    # order tweets in reverse chron order
    tweets = tweets.order_by("-timestamp").all()
    return JsonResponse([tweet.serialize() for tweet in tweets], safe=False)

#
# route gettweet
#   get exiting tweet
#
@csrf_exempt
def gettweet(request, tweetid):
    try:
        tweet = Tweet.objects.get(id=tweetid)
    except Tweet.DoesNotExist:
        return JsonResponse({"error": "Tweet not found"}, status=400)
    return JsonResponse(tweet.serialize(), status=201)

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

@csrf_exempt
@login_required
def changetweet(request):
    # must be a POST request
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)
    data = json.loads(request.body)
    id = data.get("id")
    print("changing tweet ", id)
    body = data.get("body", "")
    print("new body ", body)
    changingtweet = Tweet.objects.get(id=id)
    changingtweet.body = body
    changingtweet.save()
    print("about to return: ", changingtweet.serialize())
    return JsonResponse(changingtweet.serialize(), status=201)

@csrf_exempt
@login_required
def togglelike(request):
    # must be a POST request
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)
    data = json.loads(request.body)
    id = data.get("id")
    print("adding like to tweet ", id)
    tweet = Tweet.objects.get(id=id)
    if request.user in tweet.likes.all():
        print("removing like from tweet ", id)
        tweet.likes.remove(request.user)
    else:
        print("adding like to tweet ", id)
        tweet.likes.add(request.user)
    tweet.save()
    return JsonResponse(tweet.serialize(), status=201)

@csrf_exempt
@login_required
def togglefollow(request):
    # must be a POST request
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)
    data = json.loads(request.body)
    id = data.get("id")
    # get my profile
    profile = Profile.objects.get(user=request.user)
    # get user data for id passed
    tofollow = User.objects.get(id=id)
    # already following?
    if tofollow in profile.follows:
        # yes, unfollow
        print("unfollowing ", tofollow.username)
        profile.follows.remove(tofollow)
    else:
        # no, follow
        print("following ", tofollow.username)
        profile.follows.add(tofollow)
    profile.save()
    return JsonResponse(profile.serialize(), status=201)


#
# route displayprofile/<profile>
#   display a user's profile
#
def displayprofile(request, username):
    print('request for profile for ', username)
    # get current logged in user if special username
    if username == "current_user":
        theuser = request.user
    else:
        # query for requested user
        try:
            theuser = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
    # query for user's profile - create if necessary
    try: 
        theprofile = Profile.objects.get(user=theuser)
    except Profile.DoesNotExist:
        # create new profile
        theprofile = Profile(user=theuser, description="Hi, I'm " + "@" + theuser.username + "! Welcome to my page.")
        theprofile.save()
    return JsonResponse(
        theprofile.serialize(), status=201
    )
    


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
        
        # Cannot use special name
        if username == "current_user":
            return render(request, "network/register.html", {
                "message": "Username not available."
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
