from django.urls import path
from .views import calendars, members, owner_availability, member_availability

urlpatterns = [
    path('list/', calendars.CalendarList.as_view(), name='calendar-list'),
    path('<int:calendar_id>/', calendars.CalendarDetail.as_view(), name='calendar-detail'),

    path('<int:calendar_id>/members/list/', members.MemberListView.as_view(), name='member-list'),
    path('<int:calendar_id>/members/<int:member_id>/', members.MemberDetailView.as_view(), name='member-detail'),

    path('<int:calendar_id>/availability/', owner_availability.OwnerAvailabilityView.as_view(), name='owner-availability'),
    path('<int:calendar_id>/members/<int:member_id>/availability/', member_availability.MemberAvailabilityView.as_view(), name='member-availability'),

]