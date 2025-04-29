from django.apps import AppConfig


class ElkConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'elk'

    def ready(self):
        import elk.signals
