from django.contrib import admin
from .models.Calendar import Calendar
from .models.Member import Member


# Register your models here.
admin.site.register(Calendar)
admin.site.register(Member)