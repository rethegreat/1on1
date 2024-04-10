"use client";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "./create-calendar.css";
import errorStyles from "../styles/error.module.css";
import { addInputErrorStyle, removeInputErrorStyle } from "../utils/errorHandling";

export default function CreateCalendar() {
  const router = useRouter();
  const [calendarName, setCalendarName] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState("");
  const [calendarNameError, setCalendarNameError] = useState("");
  const [durationError, setDurationError] = useState("");

  // Reset errors and input field styles
  const resetErrors = () => {
    setError("");
    removeInputErrorStyle("calendar-name");
    removeInputErrorStyle("durationInput");
    setCalendarNameError("");
    setDurationError("");
  };

  const handleDurationChange = (event) => {
    const value = event.target.value;
    // Ensure that the value is either empty (to allow clearing the input) or a positive integer
    if (value === "" || (/^\d+$/.test(value) && Number(value) > 0)) {
      setDuration(value);
    }
  };

  const createCalendarClick = async (e) => {
    e.preventDefault();
    resetErrors();

    // Here you can handle the form submission, e.g., by sending data to an API
    const token = localStorage.getItem("userToken");
    try {
      const response = await fetch("https://1on1-django.fly.dev/calendars/list/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          name: calendarName,
          deadlineDate: deadlineDate,
          meeting_duration: duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.name || errorData.meeting_duration) {
          if (errorData.name) {
            setCalendarNameError(errorData.name);
            addInputErrorStyle("calendar-name");
          }
          if (errorData.meeting_duration) {
            setDurationError(errorData.meeting_duration);
            addInputErrorStyle("durationInput");
          }
        }
        throw new Error("Please check the fields above and try again");
      }

      const data = await response.json();
      console.log(data);
      router.push("/home");
    } catch (error) {
      setError(error.message);
    }
  };

  const logoutClick = () => {
    console.log("logout");
  };

  const homeClick = () => {
    console.log("personal");
    router.push("/home");
  };


  return (
    <div>
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
      <div className="cc-main">
        <header>
          <a className="logo">1on1</a>
          <nav>
            <a className="nav-link active" href="/home">
              Home
            </a>

            <a href="/" className="nav-link">
              Logout
            </a>
          </nav>
        </header>

        <div className="title">New Calendar</div>

        <div className="create-container">
          <div className="cal-num">cal 3</div>
          <input
            type="text"
            name="calendar-name"
            onChange={(e) => setCalendarName(e.target.value)}
            placeholder="enter calendar name"
            id="calendar-name"
          />
          {calendarNameError && <p className={errorStyles.error}>{calendarNameError}</p>}
          {/* <div className="pick-color">
            <div>Pick calendar color</div>
            <div className="calendar-color"></div>
          </div> */}

          <label htmlFor="durationInput">Duration (minutes):</label>
          <input
            type="number"
            id="durationInput"
            name="duration"
            value={duration}
            onChange={handleDurationChange}
            min="1"
            step="1"
          />
          {durationError && <p className={errorStyles.error}>{durationError}</p>}

          <label htmlFor="durationInput">Deadline:</label>
          <input
            type="date"
            name="deadline-date"
            placeholder="set deadline date"
            onChange={(e) => setDeadlineDate(e.target.value)}
          />

          <div className="bottom-button">
            <div className="cancel" onClick={homeClick}>
              cancel
            </div>
            <div className="submit" onClick={createCalendarClick}>
              done
            </div>
          </div>
          {error && <p className={errorStyles.error}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
