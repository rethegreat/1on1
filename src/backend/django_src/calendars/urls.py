from django.urls import path
from .views import calendars, members, owner_availability, member_availability, redirect, schedules


urlpatterns = [
    path('list/', calendars.CalendarList.as_view(), name='calendar-list'),
    path('<int:calendar_id>/', calendars.CalendarDetail.as_view(), name='calendar-detail'),

    path('<int:calendar_id>/members/list/', members.MemberListView.as_view(), name='member-list'),
    path('<int:calendar_id>/members/<int:member_id>/', members.MemberDetailView.as_view(), name='member-detail'),

    path('<int:calendar_id>/availability/', owner_availability.OwnerAvailabilityView.as_view(), name='owner-availability'),
    path('<int:calendar_id>/members/<int:member_id>/availability/', member_availability.MemberAvailabilityView.as_view(), name='member-availability'),

    path('<path:hash>', views.RedirectFromHashView.as_view(), name='redirect_from_hash'),

    path('<int:calendar_id>/schedules/', schedules.ScheduleListView.as_view(), name='schedule-list'),
    path('<int:calendar_id>/schedules/<int:schedule_id>/', schedules.ScheduleDetailView.as_view(), name='schedule-detail'),

]