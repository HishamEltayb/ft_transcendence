from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True)
    profile_image = models.CharField(max_length=255, blank=True)

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
#     profile_image VARCHAR(255)
# );