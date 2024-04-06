"use client";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addDays, startOfWeek, format, parseISO, set } from "date-fns";
import "./schedule.css";
import { getTimes } from "../utils/schedule";

export default function Schedule() {
  const router = useRouter();
  const [calendarId, setCalendarId] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [remindMessage, setRemindMessage] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [pageTotal, setPageTotal] = useState(0);
  const [currentScheduleId, setCurrentScheduleId] = useState(0);
  const [events, setEvents] = useState([]);
  const [hoveredSlot, setHoveredSlot] = useState(null);

  // 0. Set the current calendar ID + Set up blnak schedule
  useEffect(() => {
    const storedCalendar = localStorage.getItem("currentCalendar");
    const id = JSON.parse(storedCalendar).id;
    setCalendarId(id);
    setSchedule(generateScheduleWithDates());
  }, []);

  // 1. Parse the response data
  useEffect(() => {
    if (calendarId) {
      const fetchSchedule = async () => {
        const token = localStorage.getItem("userToken");
        try {
          const response = await fetch(
            `http://127.0.0.1:8000/calendars/${calendarId}/schedules/?page=${pageNum}/`,
            {
              method: "GET",
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error: ${response.statusText} - ${errorData.detail}`);
          }
          const data = await response.json();
          console.log(data);
          setPageTotal(data.count);
          if (data.count == 0) {
            alert("There is no schedule possible yet!\nPlease wait for members to submit their availability");
          } else {
            setCurrentScheduleId(data.results[0].id);
            setEvents(data.results[0].events);
          }
        } catch (error) {
          console.error(error);
        }

      };

      const getMembers = async () => {
        const token = localStorage.getItem("userToken");
        const response = await fetch(
          `http://127.0.0.1:8000/calendars/${calendarId}/members/list/`,
          {
            method: "GET",
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch members");
          return;
        }

        var data = await response.json();
        setRemindMessage(data[0].num_pending + " users have not submitted their avalibility yet")
      };

      fetchSchedule();
      getMembers();
    }
  }, [calendarId]);

  const getStartOfWeekFromDate = (dateString) => {
    const today = new Date();
    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 });
    return addDays(startOfWeekDate, weekOffset * 7);
  };

  const generateScheduleWithDates = () => {
    const startOfWeek = getStartOfWeekFromDate();
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (day, index) => ({
        day,
        date: format(addDays(startOfWeek, index), "MMM d"),
        slots: [],
      })
    );
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
        const member_id = obj["member_id"];
        const member_name = obj["member_name"];
        const member_email = obj["member_email"];

        grouped[key].slots.push({
          time: time,
          color: "#DD7800",
          name: member_name,
          member_id: member_id,
          member_email: member_email,
        });
      });

      return Object.values(grouped);
    };

    if (events.length) {
      const newScheduleParts = parseDateTime(events);
      setSchedule((prevSchedule) => {
        const existingDates = prevSchedule.map((sch) => sch.date);
        const filteredNewParts = newScheduleParts.filter((part) =>
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
  }, [events]);

  const getSlotMemberName = (slot) => {
    if (slot) {
      return slot.name;
    }
    return "";
  };

  const getSlotMemberEmail = (slot) => {
    if (slot) {
      return slot.member_email;
    }
    return "";
  };


  const remindAll = async () => {
    const token = localStorage.getItem("userToken");
    const url = `http://127.0.0.1:8000/calendars/${calendarId}/remindAll/`; // Replace https://example.com/ with your actual domain
    const requestBody = {
      pending_only: true,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Success:", data);
      setRemindMessage("reminder sent");
      return data;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

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

  // Please discard the following lines if not needed!
  // getTimes returns an array of times between the start and end times(**inclusive**) with the given interval
  // const meeting_duration = JSON.parse(localStorage.getItem("currentCalendar")).meeting_duration;
  // const times = getTimes("09:00", "17:00", meeting_duration);

  const backClick = () => {
    router.push("/personal");
  };

  const goToPreviousPage = () => {
    if (pageNum > 1) {
      setPageNum(pageNum - 1);
    } else {
      alert("You are already on the first page");
    }
  }

  const goToNextPage = () => {
    if (pageNum < pageTotal) {
      setPageNum(pageNum + 1);
    } else {
      alert("You are already on the last page");
    }
  }

  const editClick = () => {
    // Ask user to select action(Add, Edit, Delete)
    // Redirect to the selected action page
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
          <div className="back" onClick={backClick}>
            &lt; back
          </div>

          <div className="header pink">schedule</div>

          <div className="missing">
            <div className="missing-text">{remindMessage}</div>
            <div className="remind" onClick={remindAll}>
              remind
            </div>
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
                            fontSize: "15px",
                          }}
                          onMouseEnter={() => setHoveredSlot(slot)}
                          onMouseLeave={() => setHoveredSlot(null)}
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
          <div className="bottom">
            <div style={{ width: "150px" }}></div>
            <div className="page">
              <div className="arrow" onClick={goToPreviousPage}>&lt;</div>
              <div>{pageNum}/{pageTotal}</div>
              <div className="arrow" onClick={goToNextPage}>&gt;</div>
            </div>
            <div className="bottom-button">
              <div className="cancel" onClick={backClick}>
                cancel
              </div>
              <div className="submit" onClick={editClick}>
                edit
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
