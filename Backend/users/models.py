from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True)
    profile_image = models.CharField(max_length=255, blank=True)
    
    # 42 OAuth related fields
    intra_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    intra_login = models.CharField(max_length=100, blank=True, null=True)
    is_oauth_user = models.BooleanField(default=False)
    state = models.CharField(max_length=10, choices=[('OF', 'Offline'), ('ON', 'Online'), ('ID', 'In-Game')], default='OF')
    
    # 2FA fields
    is_two_factor_enabled = models.BooleanField(default=False)
    
    # Password reset fields
    reset_password_token = models.CharField(max_length=100, blank=True, null=True)
    reset_password_token_expiry = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.username
        

class PlayerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    total_games = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    rank = models.IntegerField(default=1000)  # ELO rating starting at 1000
    
    @property
    def win_rate(self):
        if self.total_games > 0:
            return round((self.wins / self.total_games) * 100, 2)
        return 0
    
    def __str__(self):
        return f"{self.user.username}'s Profile"




#postgres sql table structure

# CREATE TABLE users_user (
#     id SERIAL PRIMARY KEY,
#     username VARCHAR(150) UNIQUE NOT NULL,
#     password VARCHAR(128) NOT NULL,
#     first_name VARCHAR(150),
#     last_name VARCHAR(150),
#     is_active BOOLEAN NOT NULL,
#     is_staff BOOLEAN NOT NULL,
#     is_superuser BOOLEAN NOT NULL,
#     date_joined TIMESTAMP NOT NULL,
#     last_login TIMESTAMP,
#     -- Your custom fields:
#     email VARCHAR(254) UNIQUE NOT NULL,
#     bio TEXT,
#     profile_image VARCHAR(255),
#     -- 42 OAuth fields:
#     intra_id VARCHAR(100) UNIQUE,
#     intra_login VARCHAR(100),
#     is_oauth_user BOOLEAN NOT NULL DEFAULT FALSE
# );