from django.urls import path
from .views import calendars, members, owner_availability, member_availability, schedules


urlpatterns = [
    path('list/', calendars.CalendarList.as_view(), name='calendar-list'),
    path('<int:calendar_id>/', calendars.CalendarDetail.as_view(), name='calendar-detail'),
    path('<int:calendar_id>/remindAll/', calendars.CalendarRemind.as_view(), name='member-remind'),
    path('<int:calendar_id>/remindAdd/', calendars.CalendarRemindAdd.as_view(), name='member-remind-add'),

    path('<int:calendar_id>/members/list/', members.MemberListView.as_view(), name='member-list'),
    path('<int:calendar_id>/members/<int:member_id>/', members.MemberDetailView.as_view(), name='member-detail'),
    path('<int:calendar_id>/members/list/selection/', members.MemberSelectionView.as_view(), name='member-selection'),

    path('<int:calendar_id>/availability/', owner_availability.OwnerAvailabilityView.as_view(), name='owner-availability'),
    # path('<int:calendar_id>/members/<int:member_id>/availability/', member_availability.MemberAvailabilityView.as_view(), name='member-availability'),
    path('<calendar_id>/availability/<str:hash>/', member_availability.MemberAvailabilityView.as_view(), name='member_availability'),
    path('<int:calendar_id>/members/<int:member_id>/availability/', member_availability.MemberAvailabilityByIDView.as_view(), name='member-availability-by-id'),

    path('<int:calendar_id>/schedules/', schedules.ScheduleListView.as_view(), name='schedule-list'),
    path('<int:calendar_id>/schedules/<int:schedule_id>/', schedules.ScheduleDetailView.as_view(), name='schedule-detail'),

]