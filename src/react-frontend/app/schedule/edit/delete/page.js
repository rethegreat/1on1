"use client";
import Head from "next/head";
import { useEffect, useState } from "react";
import { addDays, startOfWeek, format, parseISO, set } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import "../../../calendars/[calendar_id]/availability/[member_hash]/calendars.css";

export default function MeetingID() {
  const router = useRouter();
  const [calendarId, setCalendarId] = useState(0);
  const [scheduleId, setScheduleId] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [datetimeList, setDatetimeList] = useState([]);
  const [scheduledSlots, setScheduledSlots] = useState([]);
  const [info, setInfo] = useState("Click on the meeting(s) you want to delete.");
  const [deleteList, setDeleteList] = useState([]);
  const [hoveredSlot, setHoveredSlot] = useState(null);

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
        // Get already scheduled meetings
        try {
          const response = await fetch(
            `https://1on1-django.fly.dev//calendars/${calendarId}/schedules/${scheduleId}`,
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
// =============================================== DELETE =================================================
  const submitDeletingList = async () => {
    if (deleteList.length === 0) {
      if (confirm("You have not selected a meeting. Do you want to quit editing the schedule?")) {
        router.push(`/schedule`);
        return;
      } else {
        return;
      }
    }
    if (confirm("Are you sure you want to delete the selected meeting(s)?")) {
      deleteMeeting(deleteList);
    } else {
      return;
    }
  };

  const deleteMeeting = async (eventIDList) => {

    const token = localStorage.getItem("userToken");

    // If this meeting is addable, add it to the schedule
    try {
      
        // For each eventID in the list, delete it
        for (const eventID of eventIDList) {
          const response = await fetch(
            `https://1on1-django.fly.dev//calendars/${calendarId}/schedules/${scheduleId}/`, {
          method: "PUT",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
              action: "delete",
              event_id: eventID,
          }),
          });
          const data = await response.json();
          console.log(data);
          
          if (!response.ok) {
              // Whatever the key is in the data, get its value and alert it
              alert(Object.values(data)[0]);
          }
        }

        // go back to the schedule page by the pageNum
        alert("Meeting(s) deleted successfully.");
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
      slots: day.slots.map((slot) => ({ ...slot }))
    }));

    if (slot != null) {
      const index = newSchedule[dayIndex].slots.findIndex((s) => s.time === slot.time);
      const color = slot.color;
      const selected = slot.selected;
      newSchedule[dayIndex].slots.splice(index, 1);

      if(!selected){

        // We will allow multiple slots to be selected (unlike the add meeting page)

        newSchedule[dayIndex].slots.push({
          id: slot.id,
          time: time,
          color: "red",
          selected: true,
          member_name: slot.member_name,
          member_email: slot.member_email,
        });

        // For convenience, we will store just this ID in the deleteList
        setDeleteList([...deleteList, slot.id]);
        
      } else {

        newSchedule[dayIndex].slots.push({
          id: slot.id,
          time: time,
          color: "gray",
          selected: false,
          member_name: slot.member_name,
          member_email: slot.member_email,
        });

        // Remove the ID from the deleteList
        const updatedList = deleteList.filter(id => id !== slot.id);
        setDeleteList(updatedList);
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
    const parseDateTime = (datetimeObjects) => {
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

        grouped[key].slots.push({ 
          id: obj["event_id"],
          time: time, 
          color: "gray", // "#CCDD00",
          member_name: obj["member_name"], 
          member_email: obj["member_email"],
          selected: false
        });
      });

      return Object.values(grouped);
    };

    const parsedScheduledSlots = parseDateTime(scheduledSlots);

    setSchedule((prevSchedule) => {
      const existingDates = prevSchedule.map((sch) => sch.date);
      const filteredNewParts = parsedScheduledSlots.filter((part) =>
        existingDates.includes(part.date)
      );

      const updatedSchedule = prevSchedule.map((sch) => {
        const newPart = filteredNewParts.find((part) => part.date === sch.date);
        if (newPart) {
          const mergedSlots = [...sch.slots, ...newPart.slots];
          return { ...sch, slots: mergedSlots };
        }
        return sch;
      });

      return updatedSchedule;
    });
  }
  , [scheduledSlots]);

  const getSlotMemberName = (slot) => {
    if (slot) {
      return slot.member_name;
    }
    return "";
  };

  const getSlotMemberEmail = (slot) => {
    if (slot) {
      return slot.member_email;
    }
    return "";
  };

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
            delete meeting
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
                      return (
                        <div
                          key={time}
                          className={`time-slot`}
                          style={{
                            backgroundColor: slot?.color || "transparent",
                            color: "white",
                            fontSize: "15px"
                          }}
                          onMouseEnter={() => setHoveredSlot(slot)}
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={() => toggleSlotSelection(dayIndex, slot, time)}
                        >
                          {/* if hovered display both name and email, otherwise just name */}
                          {hoveredSlot === slot ? (
                            <div style={{textAlign: "center", fontSize: "14px"}}>
                              <div>{getSlotMemberName(slot)}</div>
                              <div style={{color: "lightgray", fontSize: "13px"}}>{getSlotMemberEmail(slot)}</div>
                            </div>
                          ) : (
                            <div>{getSlotMemberName(slot)}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bottom-button" style={{ paddingTop: "25px"}}>
            <div className="submit" onClick={submitDeletingList}>delete</div>
          </div>
        </div>
      </div>
    </>
  );
}
