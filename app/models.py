from django.db import models
from django.contrib.auth.models import User


class NewsPrediction(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    news_text = models.TextField()

    prediction = models.CharField(
        max_length=10
    )

    confidence = models.FloatField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.prediction