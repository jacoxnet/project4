import json
from functools import reduce

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator

from django.views.decorators.csrf import csrf_exempt

from network.models import User, Profile, Tweet

PERPAGE = 10

#
# helper function
#       takes tweetlist, serializes it, then adds
#       heart color information
#
def processtweetlist(request, tweetlist):
    returnlist = []
    for tweet in tweetlist:
        stweet = tweet.serialize()
        if not request.user.is_authenticated:
            stweet['redheart'] = False
        else:
            stweet['redheart'] = (request.user in tweet.likes.all())
        returnlist.append(stweet)
    return returnlist
    

# 
# default route - 
#   returns all tweets and sends list to template
#
def index(request, page=1):
    showprofile = False
    listname = "All Posts"
    tweetlist = Tweet.objects.all().order_by("-timestamp")
    paginator = Paginator(tweetlist, per_page=PERPAGE)
    page_object = paginator.get_page(page)
    if request.user.is_authenticated:
        showinput = True
    else:
        showinput = False
    context = {
        "showinput": showinput,
        "showprofile": showprofile,
        "listname": listname,
        "tweetlist": processtweetlist(request, page_object),
        "page": {
            "current": page_object.number,
            "has_next": page_object.has_next(),
            "has_previous": page_object.has_previous()
        },
        "followbutton": "no"
    }
    return render(request, "network/index.html", context)

#
# route /profile/<str:username>
#
def profile(request, username, page=1):
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
    paginator = Paginator(tweetlist, per_page=PERPAGE)
    page_object = paginator.get_page(page)
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
    # set status of follow button
    if not request.user.is_authenticated:
        # no follow button if not logged in
        print("no follow not logged in")
        followbutton = "no"
    elif theuser == request.user:
        # no follow button if we're profiling ourself
        print("no follow button ", request.user.username, " logged in can't follow yourself")
        followbutton = "no"
    elif Profile.objects.get(user=request.user) in theuser.isfollowedby.all():
        # unfollow button if we already follow
        print("logged in user ", request.user.username, "already follows ", theuser.username)
        followbutton = "unfollow"
    else:
        # otherwise, we don't yet follow
        print("logged in user ", request.user.username, "doesn't already follow", theuser.username)
        followbutton = "follow"
    context = {
        "showinput": showinput,
        "showprofile": showprofile,
        "listname": listname,
        "profile": theprofile.serialize(),
        "tweetlist": processtweetlist(request, page_object),
        "page": {
            "current": page_object.number,
            "has_next": page_object.has_next(),
            "has_previous": page_object.has_previous()
        },
        "followbutton": followbutton
    }
    return render(request, "network/profile.html", context)


# 
# route /myfollows
#       show tweets of people the logged-in user follows
#       
@login_required
def myfollows(request, page=1):    
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
    paginator = Paginator(tweetlist, per_page=PERPAGE)
    page_object = paginator.get_page(page)
    context = {
        "showinput": showinput,
        "showprofile": showprofile,
        "listname": listname,
        "tweetlist": processtweetlist(request, page_object),
        "page": {
            "current": page_object.number,
            "has_next": page_object.has_next(),
            "has_previous": page_object.has_previous()
        },
        "followbutton": "no"
    }
    return render(request, "network/followers.html", context)


#
# API route gettweet
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
# API route addtweet
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
    newtweet = Tweet(sender=sender, body=body)
    newtweet.save()
    return JsonResponse({"message": "Tweet posted"}, status=201)

#
# API route changetweet
#   post request for changing body of a tweet
#
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

#
# API route togglelike
#       post request for toggling likes
#
@csrf_exempt
@login_required
def togglelike(request):
    # must be a POST request
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)
    data = json.loads(request.body)
    id = data.get("id")
    print("toggling like on tweet ", id)
    tweet = Tweet.objects.get(id=id)
    if request.user in tweet.likes.all():
        print("removing like from tweet ", id)
        tweet.likes.remove(request.user)
    else:
        print("adding like to tweet ", id)
        tweet.likes.add(request.user)
    tweet.save()
    returntweet = processtweetlist(request, [tweet])[0]
    return JsonResponse(returntweet, status=201)

#
# API route togglefollow
#       post request for toggling likes
#
@csrf_exempt
@login_required
def togglefollow(request):
    # must be a POST request
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)
    data = json.loads(request.body)
    username = data.get("username")
    # get my profile
    profile = Profile.objects.get(user=request.user)
    # get user data for id passed
    tofollow = User.objects.get(username=username)
    # already following?
    if tofollow in profile.follows.all():
        # yes, unfollow
        print("unfollowing ", tofollow.username)
        profile.follows.remove(tofollow)
    else:
        # no, follow
        print("following ", tofollow.username)
        profile.follows.add(tofollow)
    profile.save()
    return JsonResponse(profile.serialize(), status=201)    


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
