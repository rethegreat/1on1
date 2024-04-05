"use client";
import Head from "next/head";
import { addDays, startOfWeek, format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "./availability.css";
import { getTimes } from "../utils/schedule";

export default function Availability() {
  const router = useRouter();

  const [calendar, setCalendar] = useState(0);

  const [input, setInput] = useState([]);

  const [weekOffset, setWeekOffset] = useState(0);

  const [preference, setPreference] = useState(false);

  const [schedule, setSchedule] = useState([]);

  const [datetimeList, setDatetimeList] = useState([]);

  useEffect(() => {
    const storedCalendar = localStorage.getItem("currentCalendar");
    const id = JSON.parse(storedCalendar).id;
    setCalendar(id);
    console.log(generateScheduleWithDates());
    setSchedule(generateScheduleWithDates());
  }, []);

  useEffect(() => {
    if (calendar) {
      const fetchAvailability = async () => {
        const token = localStorage.getItem("userToken");
        console.log(token);
        try {
          const response = await fetch(
            `http://127.0.0.1:8000/calendars/${calendar}/availability/`,
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
  }, [calendar]);

  const postEachAvailability = async () => {
    const token = localStorage.getItem("userToken");
    console.log(datetimeList);
    try {
      const url = `http://127.0.0.1:8000/calendars/${calendar}/availability/`;

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
      router.push('/personal')
    } catch (error) {
      console.log(error);
      console.error("Error posting availability:", error);
    }
  };

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
        console.log(obj["preference"]);
        if (obj["preference"] === "HIGH") {
          grouped[key].slots.push({ time: time, color: "#DD7800" });
        } else {
          grouped[key].slots.push({ time: time, color: "#CCDD00" });
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

  const toggleSlotSelection = (dayIndex, slot, time) => {
    var newSchedule = [...schedule].map((day) => ({
      ...day,
      slots: day.slots.map((slot) => ({ ...slot })),
    }));

    if (slot == null) {
      if (preference) {
        newSchedule[dayIndex].slots.push({ time: time, color: "#DD7800" });
      } else {
        newSchedule[dayIndex].slots.push({ time: time, color: "#CCDD00" });
      }
    } else {
      const index = newSchedule[dayIndex].slots.findIndex((s) => s.time === slot.time);
      newSchedule[dayIndex].slots.splice(index, 1);
    }

    setSchedule(newSchedule);
    const dateTimeList = scheduleToDateTimeList(newSchedule);
    console.log(dateTimeList);
    setDatetimeList(dateTimeList);
  };

  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);

  const isFirstSlotOfEvent = (day, time) => {
    const currentIndex = day.slots.findIndex((slot) => slot.time === time);
    const previousSlot = day.slots[currentIndex - 1];
    return (
      currentIndex === 0 ||
      (previousSlot && previousSlot.color !== day.slots[currentIndex].color)
    );
  };

  const scheduleToDateTimeList = (schedules) => {
    const year = new Date().getFullYear();

    const dateTimeList = schedules.flatMap((schedule) => {
      // Convert the month name and day to a month-day string, assuming the current year
      const dateStr = `${schedule.date}, ${year}`;

      return schedule.slots.map((slot) => {
        const date = new Date(Date.parse(dateStr));
        const [hours, minutes] = slot.time.split(":").map(Number);

        // Adjust the Date object to include the specific time
        date.setHours(hours, minutes, 0); // Sets hours, minutes, and seconds

        const preference = slot.color === "#DD7800" ? "HIGH" : "LOW";

        return {
          start_time: date.toISOString(),
          preference: preference,
        };
      });
    });

    return dateTimeList;
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

  const toggleLow = () => setPreference(false);
  const toggleHigh = () => setPreference(true);

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

          <div className="header blue">availability</div>

          <div className="preference">
            <div
              className={`p-item ${preference ? "bordered" : ""}`}
              onClick={toggleHigh}
            >
              <div className="orange circle"></div>
              <div>high preference</div>
            </div>
            <div
              className={`p-item ${preference ? "" : "bordered"}`}
              onClick={toggleLow}
            >
              <div className="green circle"></div>
              <div>low preference</div>
            </div>
            <div></div>
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

          <div className="monthContainer">
            <div style={{ width: "150px" }}></div>
            <div>
              <button className="changeWeek" onClick={goToPreviousWeek}>
                &lt;
              </button>
              <button className="changeWeek" onClick={goToNextWeek}>
                &gt;
              </button>
            </div>

            <div className="bottom-button" style={{ paddingTop: "25px" }}>
              <div className="cancel" onClick={backClick}>
                cancel
              </div>
              <div className="submit" onClick={postEachAvailability}>
                submit
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
