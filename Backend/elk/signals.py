from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from elk.elasticsearch_client import es

User = get_user_model()

@receiver(post_save, sender=User)
def index_user_in_elasticsearch(sender, instance, **kwargs):
    doc = {
        "username": instance.username,
        "email": instance.email,
        "first_name": instance.first_name,
        "last_name": instance.last_name,
        "profile_image": instance.profile_image,
        "intra_id": instance.intra_id,
        "intra_login": instance.intra_login,
        "is_oauth_user": instance.is_oauth_user,
        "is_two_factor_enabled": instance.is_two_factor_enabled,
        "total_games": instance.total_games,
        "wins": instance.wins,
        "losses": instance.losses,
        "win_rate": instance.win_rate
    }
    es.index(index="users", id=instance.id, body=doc)
    