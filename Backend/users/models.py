from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class User(AbstractUser):
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
    rank = models.IntegerField(default=1000)  # ELO rating starting at 1000

    def __str__(self):
        return self.username




#postgres sql table structure

# CREATE TABLE users_user (
#     id SERIAL PRIMARY KEY,
#     username VARCHAR(150) UNIQUE NOT NULL,
#     password VARCHAR(128) NOT NULL,
#     email VARCHAR(254) UNIQUE NOT NULL,
#     profile_image VARCHAR(255),
#     -- 42 OAuth fields:
#     intra_id VARCHAR(100) UNIQUE,
#     intra_login VARCHAR(100),
#     is_oauth_user BOOLEAN NOT NULL DEFAULT FALSE
# );

# Model to store revoked Access Token JTIs
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