from django.dispatch import Signal

"""
    Notifications:
        - for member when they are added to a calendar
        - for calendar creator when a member submits/updates their time
        - for calendar creator when all members have submitted their times
        - for member when they haven't submitted their time
        - for member when the calendar has been finalized

        - for member when they are removed
"""
# first word is who gets the notif
member_added_to_calendar = Signal()
creator_member_added_to_calendar = Signal()
creator_all_member_added_to_calendar = Signal()
member_submit_reminder = Signal()
member_cal_finalized = Signal()
member_removed_from_cal = Signal()