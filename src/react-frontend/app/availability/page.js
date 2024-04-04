"use client";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "./availability.css";

export default function Availability() {
  const router = useRouter();

  const [calendar, setCalendar] = useState(0);

  const initialSchedule = [
    {
      day: "Mon",
      slots: [
        { time: "09:00", color: "green" },
        { time: "11:30", color: "green" },
      ],
    },
    {
      day: "Tue",
      slots: [{ time: "09:00", color: "green" }],
    },
    {
      day: "Wed",
      slots: [{ time: "09:00", color: "green" }],
    },
    {
      day: "Thu",
      slots: [{ time: "09:00", color: "green" }],
    },
    {
      day: "Fri",
      slots: [{ time: "09:00", color: "green" }],
    },
    {
      day: "Sat",
      slots: [{ time: "09:00", color: "green" }],
    },
    {
      day: "Sun",
      slots: [{ time: "09:00", color: "green" }],
    },
  ];

  const [schedule, setSchedule] = useState(initialSchedule);

  const toggleSlotSelection = (dayIndex, slot, time) => {
    var newSchedule = [...schedule].map((day) => ({
      ...day,
      slots: day.slots.map((slot) => ({ ...slot })),
    }));
    console.log(slot);
    console.log(time);
    console.log(newSchedule[dayIndex].slots[0]);

    if (slot == null) {
      newSchedule[dayIndex].slots.push({ color: "green", time: time });
    } else {
      const index = newSchedule[dayIndex].slots.findIndex((s) => s === slot);
      newSchedule[dayIndex].slots.splice(index, 1);
    }

    setSchedule(newSchedule);
  };

  const isFirstSlotOfEvent = (day, time) => {
    const currentIndex = day.slots.findIndex((slot) => slot.time === time);
    const previousSlot = day.slots[currentIndex - 1];
    return (
      currentIndex === 0 ||
      (previousSlot && previousSlot.color !== day.slots[currentIndex].color)
    );
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

  useEffect(() => {
    const storedCalendar = localStorage.getItem("currentCalendar");
    const id = JSON.parse(storedCalendar).id;
    setCalendar(id);
  }, []);

  const backClick = () => {
    router.push("/personal");
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

          <div className="header blue">availability</div>

          <div className="preference">
            <div className="p-item">
              <div className="green circle"></div>
              <div>high preference</div>
            </div>
            <div className="p-item">
              <div className="orange circle"></div>
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
                <div className="day">
                  <div className="label">{day.day}</div>
                  <div key={day.day} className="column">
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
            <div className="cancel" onClick={backClick}>
              cancel
            </div>
            <div className="submit">submit</div>
          </div>
        </div>
      </div>
    </>
  );
}
