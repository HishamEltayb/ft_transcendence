from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from elk.elasticsearch_client import es

class Command(BaseCommand):
    help = 'Indexes all users into Elasticsearch'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        users = User.objects.all()
        for user in users:
            doc = {
                "username": user.username,
                "email": user.email,
                "first_name": getattr(user, "first_name", None),
                "last_name": getattr(user, "last_name", None),
                "profile_image": getattr(user, "profile_image", None),
                "intra_id": getattr(user, "intra_id", None),
                "intra_login": getattr(user, "intra_login", None),
                "is_oauth_user": getattr(user, "is_oauth_user", None),
                "is_two_factor_enabled": getattr(user, "is_two_factor_enabled", None),
                "total_games": getattr(user, "total_games", None),
                "wins": getattr(user, "wins", None),
                "losses": getattr(user, "losses", None),
                "win_rate": getattr(user, "win_rate", None),
            }
            es.index(index="users", id=user.id, body=doc)
        self.stdout.write(self.style.SUCCESS(f"Indexed {users.count()} users into Elasticsearch."))
