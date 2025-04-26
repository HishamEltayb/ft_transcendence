from django.urls import path
from .views import (TournamentListCreateView, TournamentRetrieveUpdateDestroyView,
 TournamentJoinView, TournamentLeaveView
 , MatchListCreateView, MatchRetrieveUpdateDestroyView)


urlpatterns = [
    path('list/', TournamentListCreateView.as_view(), name='tournament-list-create'),
    path('<int:pk>/', TournamentRetrieveUpdateDestroyView.as_view(), name='tournament-detail'), #'<int:pk>' describes the primary key of the tournament for example '1', '2', '3', etc.
    path('<int:pk>/join/', TournamentJoinView.as_view(), name='tournament-join'),
    path('<int:pk>/leave/', TournamentLeaveView.as_view(), name='tournament-leave'),
    path('<int:tournament_pk>/matches/', MatchListCreateView.as_view(), name='match-list-create'),
    path('<int:tournament_pk>/matches/<int:pk>/', MatchRetrieveUpdateDestroyView.as_view(), name='match-detail'),
]