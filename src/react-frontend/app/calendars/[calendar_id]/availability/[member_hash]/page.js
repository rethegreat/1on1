"use client";
import Head from "next/head";
import { useEffect, useState } from "react";
import { addDays, startOfWeek, format, parseISO } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import "./calendars.css";

export default function UserAvailability() {
  const pathname = usePathname()
  
  const [calendarId, setCalendarId] = useState(0);
  const [memberHash, setMemberHash] = useState("");
  const [schedule, setSchedule] = useState([]);

  const [input, setInput] = useState([]);

  useEffect(() => {
    setSchedule(generateScheduleWithDates());
    console.log(pathname)

    const parts = pathname.split("/");
    const calendarId = parts[2]; 
    const hash = parts[3]; 

    setCalendarId(calendarId);
    setMemberHash(hash);
    console.log(calendarId)
  }, []);

  useEffect(() => {
    if (calendarId) {
      const fetchAvailability = async () => {
        const token = localStorage.getItem("userToken");
        console.log(token);
        try {
          const response = await fetch(
            `http://127.0.0.1:8000/calendars/${calendarId}/availability/`,
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
          console.log(data);
          setInput(data);
        } catch (error) {
          console.error("Failed to fetch availability:", error);
        }
      };

      fetchAvailability();
    }
  }, [calendarId]);


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

          <div className="header blue" style={{fontSize : "90px", marginBottom : "20px"}}>Member availability</div>

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
                      const isStart = slot && isFirstSlotOfEvent(day, time);
                      return (
                        <div
                          key={time}
                          className={`time-slot ${
                            isStart ? "start-of-event" : ""
                          }`}
                          style={{
                            backgroundColor: slot?.color || "transparent",
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

          <div className="bottom-button" style={{ paddingTop: "25px" }}>
            <div className="submit" >
              submit
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
