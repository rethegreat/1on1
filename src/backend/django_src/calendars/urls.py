from django.urls import path
from .views import calendars

urlpatterns = [
    path('list/', calendars.CalendarList.as_view(), name='calendar-list'),
    path('<int:calendar_id>/detail/', calendars.CalendarDetail.as_view(), name='calendar-detail'),
]