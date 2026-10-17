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
import os
import re
import joblib
from django.conf import settings
from django.shortcuts import get_object_or_404
from PIL import Image
import numpy as np
from django.http import JsonResponse

MODEL_DIR = os.path.join(settings.BASE_DIR, "models")

model = joblib.load(
    os.path.join(MODEL_DIR, "fake_news_model.pkl")
)

vectorizer = joblib.load(
    os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
)


def clean_news_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


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
def delete_prediction(request, prediction_id):
    if request.method == "POST":
        prediction = get_object_or_404(
            NewsPrediction,
            id=prediction_id,
            user=request.user
        )
        prediction.delete()
        messages.success(request, "News deleted successfully!")

    return redirect("history")


@login_required(login_url='login')
def clear_history(request):
    if request.method == "POST":
        NewsPrediction.objects.filter(
            user=request.user
        ).delete()

        messages.success(
            request,
            "Your news history has been cleared successfully!"
        )

    return redirect("history")


@login_required(login_url='login')
def about(request):
    return render(request, "app/about.html")



@login_required(login_url='login')
def check_news(request):
    if request.method == "POST":
        news_text = request.POST.get("news_text", "").strip()
        news_image = request.FILES.get("news_image")

        # Image-il ninn text vaayikkuka
        if not news_text and news_image:
            try:
                image = Image.open(news_image).convert("RGB")
                image_array = np.array(image)

                ocr_engine = RapidOCR()
                result, _ = ocr_engine(image_array)

                if result:
                    news_text = " ".join(
                        item[1] for item in result if item[1].strip()
                    ).strip()

            except Exception as e:
                messages.error(
                    request,
                    "Image vaayikkan kazhinjilla. Vere oru image try cheyyuka."
                )
                return redirect("home")

        # Text-um image text-um illenkil
        if not news_text:
            messages.error(
                request,
                "News text type cheyyukayo news image upload cheyyukayo cheyyuka."
            )
            return redirect("home")

        cleaned_text = clean_news_text(news_text)
        features = vectorizer.transform([cleaned_text])
        prediction = model.predict(features)[0]

        probabilities = model.predict_proba(features)[0]
        confidence = float(max(probabilities) * 100)

        NewsPrediction.objects.create(
            user=request.user,
            news_text=news_text,
            prediction=prediction,
            confidence=confidence
        )

        return render(request, "app/result.html", {
            "prediction": prediction,
            "confidence": confidence,
            "news_text": news_text
        })

    return redirect("home")


@login_required(login_url='login')
def extract_image_text(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Invalid request."},
            status=405
        )

    return JsonResponse(
        {
            "error": (
                "Image text extraction temporarily unavailable. "
                "Please type or paste the news text manually."
            )
        },
        status=503
    )


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