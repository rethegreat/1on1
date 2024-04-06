"use client";
import Head from "next/head";
import { useEffect, useState } from "react";
import { addDays, startOfWeek, format, parseISO } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import "./calendars.css";

export default function UserAvailability() {
  const pathname = usePathname();

  const [calendarId, setCalendarId] = useState(0);
  const [memberHash, setMemberHash] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [datetimeList, setDatetimeList] = useState([]);

  const [input, setInput] = useState([]);

  const [info, setInfo] = useState("Click on the bubbles if you are availaible to meet at that time");

  useEffect(() => {
    setSchedule(generateScheduleWithDates());
    console.log(pathname);

    const parts = pathname.split("/");
    const calendarId = parts[2];
    const hash = parts[4];

    setCalendarId(calendarId);
    setMemberHash(hash);
    console.log(calendarId);
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

  const postEachAvailability = async () => {
    const token = localStorage.getItem("userToken");
    console.log(datetimeList);
    try {
      const url = `http://127.0.0.1:8000/calendars/${calendarId}/availability/${memberHash}/`;

      // Make the POST request
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(datetimeList),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.detail}`);
      }

      const responseData = await response.json();
      console.log("Success:", responseData);
      setInfo("sucessfully submitted");

    } catch (error) {
      console.log(error);
      console.error("Error posting availability:", error);
    }
  };

  const toggleSlotSelection = (dayIndex, slot, time) => {
    var newSchedule = [...schedule].map((day) => ({
      ...day,
      slots: day.slots.map((slot) => ({ ...slot })),
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
        });
      } else {
        newSchedule[dayIndex].slots.push({
          time: time,
          color: color,
          selected: false,
        });
      }
      
    }
    console.log(newSchedule)
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
  
        const preference = slot.color === "#DD7800" ? "HIGH" : "LOW";
  
        return {
          start_time: date.toISOString(),
          preference: preference,
        };
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
        console.log(obj["preference"]);
        if (obj["preference"] === "HIGH") {
          grouped[key].slots.push({ time: time, color: "#DD7800", selected: false });
        } else {
          grouped[key].slots.push({ time: time, color: "#CCDD00", selected: false });
        }
      });

      return Object.values(grouped);
    };

    const newScheduleParts = parseDateTime(input);

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
  }, [input]);

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
          <div
            className="header blue"
            style={{ fontSize: "90px", marginBottom: "20px" }}
          >
            Member availability
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
                          className={`availaible-time-slot`}
                          style={{
                            borderColor: slot?.color || "transparent",
                            backgroundColor: slot?.selected ? slot.color : "transparent",
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
            <div className="submit" onClick={postEachAvailability}>submit</div>
          </div>
        </div>
      </div>
    </>
  );
}
