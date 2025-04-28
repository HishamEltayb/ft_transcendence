from django.urls import path
from .views import (MatchCreateView, TournamentCreateView, TournamentListView)

urlpatterns = [
    path('match/', MatchCreateView.as_view(), name='match-list-create'),
    path('tournament/', TournamentCreateView.as_view(), name='tournament-list-create'),
    path('tournament/list/' , TournamentListView.as_view(), name='tournament-list')
]
