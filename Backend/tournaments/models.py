from django.db import models

class Tournament(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    matches = models.JSONField(default=list, blank=True, null=True)

    def __str__(self):
        return f"Tournament {self.id}"


class Match(models.Model):
    player1Name  = models.CharField(max_length=150)
    player2Name  = models.CharField(max_length=150)
    player1Score = models.IntegerField()
    player2Score = models.IntegerField()
    matchType = models.CharField(max_length=150, choices=(('1 vs 1','1 vs 1'),('1 vs AI','1 vs AI'),('multiplyer','multiplyer'),('tournament','tournament')) )      
    winner        = models.CharField(max_length=7, choices=(('player1','Player 1'),('player2','Player 2')))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player1Name} vs {self.player2Name} → {self.winner}"