from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import never_cache
from .models import NewsPrediction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


def register(request):
    if request.method == "POST":

        first_name = request.POST["first_name"]
        last_name = request.POST["last_name"]
        username = request.POST["username"]
        email = request.POST["email"]
        password = request.POST["password"]
        confirm_password = request.POST["confirm_password"]

        if password != confirm_password:
            messages.error(request, "Passwords do not match!")
            return redirect("register")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists!")
            return redirect("register")

        User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        messages.success(request, "Registration successful!")
        return redirect("login")

    return render(request, "app/register.html")


def user_login(request):
    if request.method == "POST":

        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            login(request, user)
            messages.success(request, "Login successful!")
            return redirect("home")

        else:
            messages.error(request, "Invalid username or password!")
            return redirect("login")

    return render(request, "app/login.html")

def user_logout(request):
    logout(request)
    return redirect("login")   


@never_cache
@login_required(login_url='login')
def home(request):
    return render(request, "app/home.html")


@login_required(login_url='login')
def history(request):
    predictions = NewsPrediction.objects.filter(
        user=request.user
    ).order_by('-created_at')

    return render(
        request,
        "app/history.html",
        {"predictions": predictions}
    )

@login_required(login_url='login')
def about(request):
    return render(request, "app/about.html")

@login_required(login_url='login')
def check_news(request):

    if request.method == "POST":

        news_text = request.POST.get("news_text")

        if not news_text:
            messages.error(request, "Please enter a news article.")
            return redirect("home")

        NewsPrediction.objects.create(
            user=request.user,
            news_text=news_text,
            prediction="PENDING"
        )

        messages.success(request, "News submitted successfully!")

        return redirect("home")

    return redirect("home")

class JWTTestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "message": "JWT authentication successful!",
            "username": request.user.username
        })


class CheckNewsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        news_text = request.data.get("news_text")

        if not news_text:
            return Response(
                {"error": "Please enter a news article."},
                status=400
            )

        prediction = NewsPrediction.objects.create(
            user=request.user,
            news_text=news_text,
            prediction="PENDING"
        )

        return Response({
            "message": "News submitted successfully!",
            "username": request.user.username,
            "news_id": prediction.id,
            "prediction": prediction.prediction
        })