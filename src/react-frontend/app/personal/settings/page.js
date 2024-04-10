"use client";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./settings.css";
import errorStyles from "../../styles/error.module.css";
import { addInputErrorStyle, removeInputErrorStyle } from "../../utils/errorHandling";
import { set } from "date-fns";

export default function Settings() {
  const router = useRouter();
  const [calendarId, setCalendarId] = useState(0);
  const [calendar, setCalendar] = useState({}); 
  const [calendarFinalized, setCalendarFinalized] = useState(false);
  const [manuallyFinalized, setManuallyFinalized] = useState(false);
  // [id, name, color, description, meeting_duration, deadline, frequency, finalized]
  // id, finalized is read-only, and no field is required
  // We will also ban the user from changing the calendar frequency for now(scheduling, availability frontend)

  // Below are fields
  const [name, setName] = useState("");
  // const [calendarColor, setCalendarColor] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [duration, setDuration] = useState("");
  const [frequency, setFrequency] = useState("");

  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [deadlineError, setDeadlineError] = useState("");
  const [durationError, setDurationError] = useState("");

  // Messages for fields that are not modifiable
  const [durationMessage, setDurationMessage] = useState("");
  const [frequencyMessage, setFrequencyMessage] = useState("");

  // Reset errors and input field styles + messages
  const resetErrors = () => {
    setError("");
    removeInputErrorStyle("calendar-name");
    removeInputErrorStyle("durationInput");
    setNameError("");
    setDurationError("");
    setDeadlineError("");
    setDurationMessage("");
    setFrequencyMessage("");
  };

  useEffect(() => {
    resetErrors();
    const storedCalendar = localStorage.getItem("currentCalendar");
    const id = JSON.parse(storedCalendar).id;
    setCalendarId(id);
  }, []);

  useEffect(() => {
    const getCalendar = async () => {
      const token = localStorage.getItem("userToken");
      try {
        const response = await fetch(
          `http://1on1-django.fly.dev/calendars/${calendarId}/`,
          {
            method: "GET",
            headers: {
              Authorization: `Token ${token}`,
            },

          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(`Error: ${data}`);
        }
        setCalendar(data);
        setName(data.name);
        setDescription(data.description);
        setDeadlineDate(data.deadline);
        setDuration(data.meeting_duration);
        setFrequency(data.frequency);
        setCalendarFinalized(data.finalized);
      } catch (error) {
        console.error("Failed to fetch calendar:", error);
      }
    };

    if (calendarId) {
      getCalendar();
    }
  }, [calendarId]);

  // ================================ Getters ==================================================

  const getCalendarId = calendarId;
  const getFinalized = () => {
    if (calendarFinalized) {
      return "finalized";
    } else {
      return "not finalized";
    }
  };

  // ================================ Input Changes ==================================================

  const handleDurationChange = (event) => {
    const value = event.target.value;
    // Ensure that the value is either empty (to allow clearing the input) or a positive integer
    if (value === "" || (/^\d+$/.test(value) && Number(value) > 0)) {
      setDuration(value);
    }
  };

  // ================================ Main Action ==================================================

  const editCalendarClick = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("userToken");
    try {
      const response = await fetch(
        `http://1on1-django.fly.dev/calendars/${calendarId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            name: name,
            description: description,
            meeting_duration: duration,
            deadline: deadlineDate,
            frequency: frequency,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        // Parse data to get the error message
        // if data consists of "detail" key then it is the error message regarding the finalization
        if (data.message) {
          setError(`${data.message}`);
          setManuallyFinalized(true);
        } else if (data.detail) {
          setError(`${data.detail}`);
        } else {
        // else it is the error message regarding the body input(each field)
        if (data.name) {
          setNameError(data.name);
          addInputErrorStyle("calendar-name");
        }
        if (data.meeting_duration) {
          setDurationError(data.meeting_duration);
          addInputErrorStyle("durationInput");
        }
        if (data.deadline) {
          setDeadlineError(data.deadline);
          addInputErrorStyle("deadline-date");
        }
        setError("Please check the form for errors and try again");
        }
        return;
      }
      alert("Calendar updated successfully");
      if (confirm ("Do you want to go back to the calendar page?")) {
        router.push("/personal");
      }
      return;
    } catch (error) {
      console.error("Failed to update calendar:", error);
    }
  };

  // ================================ Other Clicks ============================================================

  const backClick = () => {
    if (confirm("Your changes will not be saved automatically. Are you sure you want to leave?")) {
      router.push("/personal");
    }
    return;
  };


  const logoutClick = () => {
    console.log("logout");
  };

  const deleteClick = async (e) => {
    if (confirm("Are you sure you want to delete this calendar?")) {
      const token = localStorage.getItem("userToken");
      try {
        const response = await fetch(
          `http://1on1-django.fly.dev/calendars/${calendarId}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );
        // If the response is not 204 No Content, throw an error
        if (response.status !== 204) {
          throw new Error("Failed to delete calendar");
        }
        alert("Calendar deleted");
        router.push("/home");
      } catch (error) {
        console.error("Failed to delete calendar:", error);
      }
    }
    return;
  };

  // ========================================================================================================


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
      <a className="back" href="/personal">
        {" "}
        &lt; back
      </a>
      {/* <header>
          <nav>
            <a href="/home" className="nav-link">
              Home
            </a>
            <a href="/" onClick={logoutClick} className="nav-link">
              Logout
            </a>
          </nav>
        </header> */}
      

        <div className="title">settings</div>

        <div className="create-container">
          {/* <div className="cal-num">cal {getCalendarId}</div> */}
          <div className="finalized-status">{getFinalized()}</div>
          <input
            type="text"
            name="calendar-name"
            onChange={(e) => setName(e.target.value)}
            id="calendar-name"
            value={name}
          />
          {nameError && <p className={errorStyles.error}>{nameError}</p>}

          <label htmlFor="descriptionInput">Description:</label>
          <input
            type="text"
            id="descriptionInput"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label htmlFor="durationInput">Duration (minutes):</label>
          <input
            type="number"
            id="durationInput"
            name="duration"
            value={duration}
            onChange={() => setDurationMessage("This field is not modifiable")}
            min="1"
            step="1"
          />
          {durationError && <p className={errorStyles.error}>{durationError}</p>}
          {durationMessage && <p className="field-message">{durationMessage}</p>}

          <label htmlFor="durationInput">Deadline:</label>
          <input
            type="date"
            name="deadline-date"
            // onChange={(e) => setDeadlineDate(e.target.value)}
          />
          {deadlineError && <p className={errorStyles.error}>{deadlineError}</p>}

          <label htmlFor="frequencyInput">Frequency:</label>
          <select
            name="frequency"
            id="frequencyInput"
            value={frequency}
            className=""
            // onChange={(e) => setFrequency(e.target.value)}
            onChange={() => setFrequencyMessage("This field is not modifiable")}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
          {frequencyMessage && <p className="field-message">{frequencyMessage}</p>}

          <div className="bottom-button">
            <div className="cancel" onClick={deleteClick}>
              delete
            </div>
            {manuallyFinalized ?

            <div className="submit" style={
              {backgroundColor: "gray"}} onClick={() => {alert("This calendar is finalized manually. You cannot edit it.")}}>
              done
            </div> 
              :
            <div className="submit" onClick={editCalendarClick}>
              done
            </div>}
          </div>
          {error && <p className={errorStyles.error}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
