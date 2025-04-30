from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from tournaments.models import Match

class User(AbstractUser):
    """
    User model for the application.
    """
    email = models.EmailField(unique=True)
    profile_image = models.CharField(max_length=255, blank=True, null=True)
    
    # 42 OAuth related fields
    intra_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    intra_login = models.CharField(max_length=100, blank=True, null=True)
    is_oauth_user = models.BooleanField(default=False)
    
    # 2FA fields
    is_two_factor_enabled = models.BooleanField(default=False)

    # Game related fields
    total_games = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    win_rate = models.FloatField(default=0.0)
    matchHistory = models.ManyToManyField(Match, blank=True, related_name="matchHistory")
    rank = models.CharField(max_length=100, blank=True, null=True)

    def update_stats(self):
        self.total_games = self.matchHistory.count()
        self.wins = self.matchHistory.filter(winner=self.username).count()
        self.losses = self.total_games - self.wins
        self.win_rate = round((self.wins / self.total_games) * 100, 2) if self.total_games > 0 else 0.0
        if self.wins < 5:
            self.rank = "Bronze"
        elif self.wins < 10:
            self.rank = "Silver"
        elif self.wins < 20:
            self.rank = "Gold"
        elif self.wins < 50:
            self.rank = "Platinum"
        elif self.wins < 100:
            self.rank = "Diamond"
        else:
            self.rank = "Master"
        self.save()
    
    def __str__(self):
        return self.username



class RevokedAccessToken(models.Model):
    """
    Stores the entire string of access tokens that have been revoked
    before their expiry time.
    """
    # Store the full token string. It's long, so use TextField.
    # Making it primary key might be inefficient for large text fields,
    # but ensures uniqueness directly. Consider adding a separate auto-incrementing ID
    # and a unique constraint on 'token' for better performance if needed later.
    token = models.TextField(unique=True, primary_key=True, help_text="The full string of the revoked JWT Access Token.")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, # Link to the user who owned the token
        on_delete=models.CASCADE,
        related_name="revoked_access_tokens",
        null=True, # Allow null if user info isn't critical or available
        blank=True
    )
    revoked_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when the token was revoked.")

    def __str__(self):
        return f"Revoked token for user {self.user_id}: {self.token}"

    class Meta:
        verbose_name = "Revoked Access Token"
        verbose_name_plural = "Revoked Access Tokens"
        ordering = ['-revoked_at']