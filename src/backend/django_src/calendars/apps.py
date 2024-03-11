from django.apps import AppConfig


class CalendarsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'calendars'

    def ready(self):
        # Import signal handlers and connect them here
        from . import signals
