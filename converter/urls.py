from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('trend/', views.currency_trend, name='currency_trend'),
]
