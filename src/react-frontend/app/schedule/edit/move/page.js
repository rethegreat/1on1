"use client";
import Head from "next/head";
import { useEffect, useState } from "react";
import { addDays, startOfWeek, format, parseISO, set } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import "../../../calendars/[calendar_id]/availability/[member_hash]/calendars.css";

export default function MoveMeeting() {
  const router = useRouter();
  const [calendarId, setCalendarId] = useState(0);
  const [scheduleId, setScheduleId] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [datetimeList, setDatetimeList] = useState([]);
  const [idToName, setIdToName] = useState({});
  const [memberSlots, setMemberSlots] = useState([]);
  const [slotToMembers, setSlotToMembers] = useState({});
  const [scheduledSlots, setScheduledSlots] = useState([]);
  const [info, setInfo] = useState("Drag and drop to move a meeting.");
  const [movingSlot, setMovingSlot] = useState(null);
  const [destinationSlot, setDestinationSlot] = useState(null);
  const [members, setMembers] = useState([]);

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

        var tempMembers = [];
        // Get all members
        try {
          const response = await fetch(
            `https://1on1-django.fly.dev//calendars/${calendarId}/members/list/`,
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
          // Remove the first element of the array
          data.shift();
          tempMembers = data.filter((member) => member.submitted).map((member) => member.id);
          setMembers(members);
        } catch (error) {
          console.error("Failed to fetch members:", error);
        }

        const tempSlotToMembers = {};
        const tempMemberSlots = [];
        const tempIdToName = {};
        for (const memberId of tempMembers) {

          try {
            // Get member availability
            const response = await fetch(
              `https://1on1-django.fly.dev//calendars/${calendarId}/members/${memberId}/availability/`,
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

            // Get that member's availability(the previously submitted slot lists)
            const memberSlots = data.previously_submitted;

            // For each slot, add start_time to tempSlotToMembers with value member_ids
            for (const slot of memberSlots) {
              // If the start_time is not in tempSlotToMembers, add it
              if (!tempSlotToMembers[slot.start_time]) {
                tempSlotToMembers[slot.start_time] = [];
                // Plus add it to the tempMemberSlots(which is the list of all slots for all members)
                tempMemberSlots.push(slot);
              }
              tempSlotToMembers[slot.start_time].push(memberId);
              tempIdToName[memberId] = data.member.name;
            }

          } catch (error) {
            console.error("Failed to fetch availability:", error);
          }
        }
        setSlotToMembers(tempSlotToMembers);
        setMemberSlots(tempMemberSlots);
        setIdToName(tempIdToName);
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
// =============================================== MOVE =================================================

  const cancelClick = () => {
    router.push('/schedule');
    return;
  }

  const moveMeeting = async () => {

    const token = localStorage.getItem("userToken");
    
    try {
      const eventID = movingSlot.id;
      const newTime = destinationSlot.start_time;
      const response = await fetch(
        `https://1on1-django.fly.dev//calendars/${calendarId}/schedules/${scheduleId}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
            action: "move",
            event_id: eventID,
            new_time: newTime,
        }),
      });
      const data = await response.json();
      
      if (!response.ok) {
          // Whatever the key is in the data, get its value and alert it
          alert(Object.values(data)[0]);
        
      }

      router.push('/schedule');
      return;


    } catch (error) {
        console.error(error);
    }
  }
  // ========================================================================================================

  const handleDrop = () => {
    // if there is a movingSlot and the destination is valid(i.e., not the same slot)
    if (movingSlot) {
      // setDestinationSlot(slot);
      // setInfo(`You are moving the meeting from ${movingSlot.time} to ${slot.time}.`);
      moveMeeting();
    }
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
    if (schedule.length === 0) {
      return;
    }
    if (memberSlots.length === 0) {
      return;
    }
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

        if (isMemberSlot) {
          const memberIDs = slotToMembers[obj["start_time"]];
          const memberNames = memberIDs.map((id) => idToName[id]);

          grouped[key].slots.push({ 
            time: time, 
            color: "lightblue",
            start_time: obj["start_time"], 
            id: obj["id"],
            member_ids: memberIDs,
            member_names: memberNames});
        } else {
          // For scheduledSlots
          grouped[key].slots.push({ 
            time: time, 
            color: "#DD7800", 
            member_id: obj["member_id"], 
            member_name: obj["member_name"], 
            start_time: obj["start_time"], 
            id: obj["event_id"]});
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
  , [slotToMembers, scheduledSlots]);

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
            move meeting
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
                              cursor: "pointer",
                            }}
                            // This is what can be dragged
                            draggable={true}
                            // DragStart is when the dragging starts(i.e., when mouse is pressed down)
                            onDragStart={() => setMovingSlot(scheduledSlot)}
                            // DragLeave is when the dragged element leaves the current element
                            onDragLeave={() => setDestinationSlot(null)}
                            // DragEnd is when the dragging ends(i.e., when mouse is released)
                            onDragEnd={() => setMovingSlot(null)}
                          >
                            {scheduledSlot?.member_name}
                          </div>
                        );
                      }

                      var slot = day.slots.find((slot) => slot.time === time);
                      // if the dragging started, only display if the movingSlot.id is in the member_ids
                      if (movingSlot && slot && !slot.member_ids.includes(movingSlot.member_id)) {
                        slot = null;
                      }
                      const memberNamesStr = slot?.member_names.join(", ");

                      return (
                        <div
                          key={time}
                          className={`availaible-time-slot`}
                          style={{
                            borderColor: slot?.color || "transparent",
                            backgroundColor: slot?.selected ? slot.color : "transparent",
                            color: slot?.color || "transparent",
                            fontSize: "15px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: "pointer",
                          }}

                          // This is where the dragged slot can be placed

                          // DragOver is when the dragged element is over the current element
                          onDragOver={(e) => e.preventDefault()}

                          // DragEnter is when the dragged element enters the current element
                          onDragEnter={() => setDestinationSlot(slot)}

                          // Drop is when the dragged element is dropped on the current element
                          onDrop={() => handleDrop(slot)}
                          
                        >
                          {(movingSlot && slot) ? movingSlot["member_name"] : slot ? memberNamesStr : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bottom-button" style={{ paddingTop: "25px"}}>
            <div className="submit cancel" onClick={cancelClick}>cancel</div>
          </div>
        </div>
      </div>
    </>
  );
}
