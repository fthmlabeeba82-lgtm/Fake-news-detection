from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.user_login, name="login"),
    path("home/", views.home, name="home"),
    path("about/", views.about, name="about"),
    path("history/", views.history, name="history"),
    path("check-news/", views.check_news, name="check_news"),
    path("logout/", views.user_logout, name="logout"),

    
    path("api/jwt-test/", views.JWTTestView.as_view(), name="jwt_test"),
    path(
    "api/check-news/",views.CheckNewsAPIView.as_view(),name="api_check_news"),
]