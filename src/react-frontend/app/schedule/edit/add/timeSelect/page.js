"use client";
import Head from "next/head";
import { useEffect, useState } from "react";
import { addDays, startOfWeek, format, parseISO, set } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import "../../../../calendars/[calendar_id]/availability/[member_hash]/calendars.css";

export default function MeetingTime() {
  const router = useRouter();
  const [calendarId, setCalendarId] = useState(0);
  const [scheduleId, setScheduleId] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [datetimeList, setDatetimeList] = useState([]);
  const [memberSlots, setMemberSlots] = useState([]);
  const [scheduledSlots, setScheduledSlots] = useState([]);
  const [info, setInfo] = useState("Click on the bubble to select a time for the meeting.");
  const [addList, setAddList] = useState([]);

  useEffect(() => {
    setSchedule(generateScheduleWithDates());
    const storedCalendar = localStorage.getItem("currentCalendar");
    const id = JSON.parse(storedCalendar).id;
    setCalendarId(id);
    const storedScheduleID = localStorage.getItem("scheduleId");
    const scheduleId = parseInt(storedScheduleID);
    setScheduleId(scheduleId);
  }, []);

  useEffect(() => {
    if (calendarId && scheduleId) {
      const fetchAvailability = async () => {
        const token = localStorage.getItem("userToken");
        const memberId = localStorage.getItem("selectedMemberId");
        // Get member availability
        try {
          const response = await fetch(
            `https://1on1-django.fly.dev/calendars/${calendarId}/members/${memberId}/availability/`,
            {
              method: "GET",
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }
          const data = await response.json();
          setMemberSlots(data.previously_submitted);
        } catch (error) {
          console.error("Failed to fetch availability:", error);
        }

        // Get already scheduled meetings
        try {
          const response = await fetch(
            `https://1on1-django.fly.dev/calendars/${calendarId}/schedules/${scheduleId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }
          const data = await response.json();
          setScheduledSlots(data.events);
        } catch (error) {
          console.error("Failed to fetch scheduled slots:", error);
        }
      };

      fetchAvailability();
    }
  }, [calendarId, scheduleId]);

  
// ========================================================================================================
// =============================================== ADD =================================================
  const submitAddList = async () => {
    if (addList.length === 0) {
      if (confirm("You have not selected a time. Do you want to quit editing?")) {
        router.push(`/schedule`);
        return;
      } else {
        return;
      }
    }
    addMeeting(addList);
  };

  const addMeeting = async (addList) => {

    const memberId = localStorage.getItem("selectedMemberId");
    const token = localStorage.getItem("userToken");

    if (memberId === 0) {
        alert("Member ID is not set");
        return;
    }
    if (addList == []) {
        alert("Meeting new time is not set");
        return;
    }
    // If this meeting is addable, add it to the schedule
    try {
      for (const newTime of addList) {
        const response = await fetch(
          `https://1on1-django.fly.dev/calendars/${calendarId}/schedules/${scheduleId}/`, {
          method: "PUT",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
              action: "add",
              member_id: memberId,
              new_time: newTime,
          }),
        });
        const data = await response.json();
        
        if (!response.ok) {
            // Whatever the key is in the data, get its value and alert it
            alert(Object.values(data)[0]);
        }
      }

        alert("Meeting(s) added successfully");
        router.push(`/schedule`);
        return;

    } catch (error) {
        console.error(error);
    }
  }
  // ========================================================================================================

  const toggleSlotSelection = (dayIndex, slot, time) => {
    var newSchedule = [...schedule].map((day) => ({
      ...day,
      slots: day.slots.map((slot) => ({ ...slot })),
      scheduledSlots: day.scheduledSlots.map((slot) => ({ ...slot })),
    }));

    if (slot != null) {
      const index = newSchedule[dayIndex].slots.findIndex((s) => s.time === slot.time);
      const color = slot.color;
      const selected = slot.selected;
      newSchedule[dayIndex].slots.splice(index, 1);

      if(!selected){

        newSchedule[dayIndex].slots.push({
          time: time,
          color: color,
          selected: true,
          start_time: slot.start_time,
        });

        setAddList([...addList, slot.start_time]);
        
      } else {
        
        newSchedule[dayIndex].slots.push({
          time: time,
          color: color,
          selected: false,
          start_time: slot.start_time,
        });

        // Remove the ID from the addList array
        const addListCopy = [...addList];
        const index = addListCopy.indexOf(slot.start_time);
        if (index > -1) {
          addListCopy.splice(index, 1);
        }
        setAddList(addListCopy);

      }
      
    }
    setSchedule(newSchedule);
    const dateTimeList = scheduleToDateTimeList(newSchedule);
    setDatetimeList(dateTimeList);
  };

  const scheduleToDateTimeList = (schedules) => {
    const year = new Date().getFullYear();

    const dateTimeList = schedules.flatMap((schedule) => {
      // Convert the month name and day to a month-day string, assuming the current yea
      const dateStr = `${schedule.date}, ${year}`;

      return schedule.slots.filter((slot) => slot.selected).map((slot) => {
        const date = new Date(Date.parse(dateStr));
        const [hours, minutes] = slot.time.split(":").map(Number);
  
        date.setHours(hours, minutes, 0);
  
        return date.toISOString();
      });
    });

    return dateTimeList;
  };

  useEffect(() => {
    if (memberSlots.length > 0) {
    setSchedule(generateScheduleWithDates());
    const parseDateTime = (datetimeObjects, isMemberSlot) => {
      const grouped = {};

      datetimeObjects.forEach((obj) => {

        const startDate = parseISO(obj["start_time"]);
        const dayOfWeek = format(startDate, "eee");
        const date = format(startDate, "MMM d");
        const time = format(startDate, "HH:mm");

        const key = `${dayOfWeek}-${date}`;

        if (!grouped[key]) {
          grouped[key] = {
            day: dayOfWeek,
            date: date,
            slots: [],
          };
        }

        // For memberSlots(i.e. if there exists a key named "preference")
        if (isMemberSlot) {
          if (obj["preference"] === "HIGH") {
            grouped[key].slots.push({ time: time, color: "#DD7800", selected: false, start_time: obj["start_time"]});
          } else {
            grouped[key].slots.push({ time: time, color: "#CCDD00", selected: false, start_time: obj["start_time"] });
          }
        } else {
          // For scheduledSlots
          grouped[key].slots.push({ time: time, color: "lightgray", member_name: obj["member_name"], start_time: obj["start_time"]});
        }
      });

      return Object.values(grouped);
    };
    const parsedScheduledSlots = parseDateTime(scheduledSlots, false);
    const parsedPossibleSlots = parseDateTime(memberSlots, true);

    // For Choosable Slots:
    setSchedule((prevSchedule) => {
      const existingDates = prevSchedule.map((sch) => sch.date);
      const filteredNewParts = parsedPossibleSlots.filter((part) =>
        existingDates.includes(part.date)
      );

      // For Choosable Slots:
      const updatedSchedule = prevSchedule.map((sch) => {
        const newPart = filteredNewParts.find((part) => part.date === sch.date);
        if (newPart) {
          const mergedSlots = [...sch.slots, ...newPart.slots];
          return { ...sch, slots: mergedSlots };
        }
        return sch;
      });

      // For Unchoosable Slots:
      const updatedScheduleWithScheduledSlots = updatedSchedule.map((sch) => {
        // Find the scheduled slots that match the current date
        const scheduledPart = parsedScheduledSlots.find((part) => part.date === sch.date);
        if (scheduledPart) {
          // Include the scheduled slots in the schedule's scheduledSlots
          const mergedScheduledSlots = [...sch.scheduledSlots, ...scheduledPart.slots];
          return { ...sch, scheduledSlots: mergedScheduledSlots };
        }
        return sch;
      });

      return updatedScheduleWithScheduledSlots;
    });
  }
  }, [memberSlots, scheduledSlots]);

  // ========================================================================================================

  const times = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "01:00",
    "01:30",
    "02:00",
    "02:30",
    "03:00",
    "03:30",
    "04:00",
    "04:30",
    "05:00",
  ];

  const getStartOfWeekFromDate = (dateString) => {
    const today = new Date();
    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 });
    return addDays(startOfWeekDate, 0);
  };

  const generateScheduleWithDates = () => {
    const startOfWeek = getStartOfWeekFromDate();
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (day, index) => ({
        day,
        date: format(addDays(startOfWeek, index), "MMM d"),
        slots: [],
        scheduledSlots: [], // Scheduled
      })
    );
  };

  return (
    <>
      <Head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Import Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;700;900&family=Roboto:wght@100;300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="calendar-body">
        <div className="calendar-main">
          <div
            className="header blue"
            style={{ fontSize: "90px", marginBottom: "20px" }}
          >
            select time
          </div>

          <div style={{ margin: "10px", fontSize: "20px" }}>
            {info}
          </div>
          <div className="calendar">
            <div className="avilability-content">
              <div className="time">
                <div className="spacer"></div>
                {times.map((time, index) => (
                  <div key={index}>{time}</div>
                ))}
              </div>
              {schedule.map((day, dayIndex) => (
                <div key={dayIndex} className="day">
                  <div className="label">
                    <div className="weekday">{day.day}</div>
                    <div className="date">{day.date}</div>
                  </div>
                  <div className="column">
                    {times.map((time) => {
                      const slot = day.slots.find((slot) => slot.time === time);
                      const scheduledSlot = day.scheduledSlots.find((slot) => slot.time === time);
                      if (scheduledSlot) {
                        return (
                          <div
                            key={time}
                            className="availaible-time-slot"
                            style={{
                              borderColor: scheduledSlot?.color || "transparent",
                              backgroundColor: scheduledSlot?.color || "transparent",
                              fontSize: "15px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {scheduledSlot.member_name}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={time}
                          className={`availaible-time-slot`}
                          style={{
                            borderColor: slot?.color || "transparent",
                            backgroundColor: slot?.selected ? slot.color : "transparent",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            toggleSlotSelection(dayIndex, slot, time)
                          }
                        ></div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bottom-button" style={{ paddingTop: "25px"}}>
            <div className="submit add-meeting" onClick={submitAddList}>add meeting</div>
          </div>
        </div>
      </div>
    </>
  );
}
