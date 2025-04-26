from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    profile_image = models.CharField(max_length=255, blank=True, null=True)
    username = models.CharField(max_length=150, unique=True)

    # 42 OAuth related fields
    is_oauth_user = models.BooleanField(default=False)
    state = models.CharField(max_length=10, choices=[('OF', 'Offline'), ('ON', 'Online'), ('ID', 'In-Game')], default='OF')
    
    # 2FA fields
    is_two_factor_enabled = models.BooleanField(default=False)

    #game stats
    total_games = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    rank = models.IntegerField(default=1000)  # ELO rating starting at 1000
    
    @property
    def win_rate(self):
        if self.total_games > 0:
            return round((self.wins / self.total_games) * 100, 2)

    def __str__(self):
        return self.username
        




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
# );
# );