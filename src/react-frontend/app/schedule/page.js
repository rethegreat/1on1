"use client";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addDays, startOfWeek, format, parseISO } from "date-fns";
import "./schedule.css";

export default function Schedule() {
  const router = useRouter();

  const [calendar, setCalendar] = useState(0);

  const [weekOffset, setWeekOffset] = useState(0);

  const [schedule, setSchedule] = useState([]);

  const [input, setInput] = useState([]);

  const [page, setPage] = useState(0);

  const [info, setInfo] = useState("");

  const backClick = () => {
    router.push("/personal");
  };

  useEffect(() => {
    const storedCalendar = localStorage.getItem("currentCalendar");
    const id = JSON.parse(storedCalendar).id;
    setCalendar(id);
    setSchedule(generateScheduleWithDates());
  }, []);

  useEffect(() => {
    if (calendar) {
      const fetchAvailability = async () => {
        const token = localStorage.getItem("userToken");
        try {
          const response = await fetch(
            `http://127.0.0.1:8000/calendars/${calendar}/schedules/?page=${page}/`,
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
          setInput(data.results);
        } catch (error) {
          console.error("Failed to fetch availability:", error);
        }
      };

      const getMembers = async () => {
        const token = localStorage.getItem("userToken");
        const response = await fetch(
          `http://127.0.0.1:8000/calendars/${calendar}/members/list/`,
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
        if (data[0].num_pending == 0) {
          setInfo("");
        } else {
          setInfo(data[0].num_pending  + " users have not submitted their avalibility yet")
        }
      };

      fetchAvailability();
      getMembers();
    }
  }, [calendar]);

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
        const name = obj["member_name"];

        grouped[key].slots.push({
          time: time,
          color: "#DD7800",
          name: name,
        });
      });

      return Object.values(grouped);
    };

    if (input[page] != null) {
      const newScheduleParts = parseDateTime(input[page].events);
      setSchedule((prevSchedule) => {
        const existingDates = prevSchedule.map((sch) => sch.date);
        const filteredNewParts = newScheduleParts.filter((part) =>
          existingDates.includes(part.date)
        );

        const updatedSchedule = prevSchedule.map((sch) => {
          const newPart = filteredNewParts.find(
            (part) => part.date === sch.date
          );
          if (newPart) {
            const mergedSlots = [...sch.slots, ...newPart.slots];
            return { ...sch, slots: mergedSlots };
          }
          return sch;
        });
        console.log(updatedSchedule);
        return updatedSchedule;
      });
    }
  }, [input, page]);

  const remindAll = async () => {
    const token = localStorage.getItem("userToken");
    const url = `http://127.0.0.1:8000/calendars/${calendar}/remindAll/`; // Replace https://example.com/ with your actual domain
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
      setInfo("reminder sent");
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

          <div className="header pink">Schedule</div>

          <div className="missing">
            { info && (
              <> 
                <div className="missing-text">{info}</div>
                <div className="remind" onClick={remindAll}>
                  remind
                </div>
              </>
            )}
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
                          }}
                        >
                          {slot ? slot.name : ""}
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
              <div className="arrow">&lt;</div>
              <div>1/3</div>
              <div className="arrow">&gt;</div>
            </div>
            <div className="bottom-button">
              <div className="cancel" onClick={backClick}>
                cancel
              </div>
              <div className="submit">submit</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
