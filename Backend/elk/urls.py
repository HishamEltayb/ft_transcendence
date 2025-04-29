from django.urls import path
from .views import elasticsearch_test

urlpatterns = [
    path('elasticsearch-test/', elasticsearch_test),
]