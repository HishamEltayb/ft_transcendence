from enum import auto
from django.db import models
from django.conf import settings # This allows you to refer to the custom user model correctly.

# Create your models here.
class Tournament(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(default='Tournament description', blank=True, null=True)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(default=None, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='participating_tournaments', blank=True)

    def __str__(self):
        return self.name


class Match(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    tournament = models.ForeignKey(Tournament, related_name='matches', on_delete=models.CASCADE) # Link to Tournament
    player1 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='matches_as_player1', on_delete=models.SET_NULL, null=True, blank=True) # Link to User (Player 1)
    player2 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='matches_as_player2', on_delete=models.SET_NULL, null=True, blank=True) # Link to User (Player 2)
    player1_score = models.IntegerField(null=True, blank=True) # Score, nullable
    player2_score = models.IntegerField(null=True, blank=True) # Score, nullable
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='won_matches', on_delete=models.SET_NULL, null=True, blank=True) # Link to User (Winner), nullable
    match_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled') # Status field
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        p1_name = self.player1.username if self.player1 else 'TBD'
        p2_name = self.player2.username if self.player2 else 'TBD'
        return f"Match in {self.tournament.name}: {p1_name} vs {p2_name} ({self.match_status})"
