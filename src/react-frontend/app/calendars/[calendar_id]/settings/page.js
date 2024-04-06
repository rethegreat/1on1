"use client";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import "../../../createCalendar/create-calendar.css";
import errorStyles from "../../../styles/error.module.css";
import { addInputErrorStyle, removeInputErrorStyle } from "../../../utils/errorHandling";

export default function CreateCalendar() {
    const router = useRouter();
    const pathname = usePathname();
    const [calendarId, setCalendarId] = useState(0);
    const [calendar, setCalendar] = useState(null);

    const token = localStorage.getItem("userToken");

    // Set calendarId from pathname
    useEffect(() => {
        // Check if the user is logged in
        if (!token) {
            router.push("/");
            return;
        }

        const parts = pathname.split("/");
        const calendarId = parts[2];

        setCalendarId(calendarId);
        console.log(calendarId);

        // Get the calendar object
        const getCalendar = async () => {

            try {
                console.log("User token: ", token);
                
                const response = await fetch(
                    `http://127.0.0.1:8000/calendars/${calendarId}/`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `token ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    alert(errorData.detail);
                    // Redirect back
                    throw new Error();
                }
                
                const data = await response.json();
                console.log(data);
                setCalendar(data);
            } catch (error) {
                alert.error(error);
                router.back();
            }
        }

        getCalendar();
    }, []);

    // ============== Helper functions ==============

    const getCalendarAttribute = (attributeNameStr) => {
        if (calendar === null) {
            return "";
        }
        return calendar[attributeNameStr];
    }

    // ============== Setting up the initial values ==============

     /***
     * 
     {
        "id": 4, -- CANNOT BE MODIFIED
        "name": "Family",
        "color": "#007bff",
        "description": null,
        "meeting_duration": 30,
        "deadline": null,
        "frequency": "YEARLY",
        "finalized": false -- CANNOT BE MODIFIED UNLESS CHANGING DEADLINE
    }
     */

    // Initial values for readonly fields
    // calendarId is already set
    const finalized = getCalendarAttribute("finalized");

    // Initial values for modifiable fields
    const [calendarName, setCalendarName] = useState(getCalendarAttribute("name"));
    const [duration, setDuration] = useState(getCalendarAttribute("meeting_duration"));
    const [deadlineDate, setDeadlineDate] = useState(getCalendarAttribute("deadline"));
    const [description, setDescription] = useState(getCalendarAttribute("description"));
    // const [color, setColor] = useState(getCalendarAttribute("color"));
    const [frequency, setFrequency] = useState(getCalendarAttribute("frequency"));

    // Error handling for form submission(ONLY modifiable fields)
    const [calendarNameError, setCalendarNameError] = useState("");
    const [durationError, setDurationError] = useState("");
    const [deadlineError, setDeadlineError] = useState("");
    const [descriptionError, setDescriptionError] = useState("");
    // const [colorError, setColorError] = useState("");
    const [frequencyError, setFrequencyError] = useState("");
    

    // Reset errors and input field styles
    const resetErrors = () => {
        removeInputErrorStyle("calendar-name");
        removeInputErrorStyle("duration");
        removeInputErrorStyle("deadline");
        removeInputErrorStyle("description");
        // removeInputErrorStyle("color");
        removeInputErrorStyle("frequency");
        setCalendarNameError("");
        setDurationError("");
        setDeadlineError("");
        setDescriptionError("");
        // setColorError("");
        setFrequencyError("");
    };

    const handleDurationChange = (event) => {
        const value = event.target.value;
        // Ensure that the value is either empty (to allow clearing the input) or a positive integer
        if (value === "" || (/^\d+$/.test(value) && Number(value) > 0)) {
        setDuration(value);
        }
    };

    // ============== When Clicked ==============

        const logoutClick = () => {
            console.log("logout");
        };

        
    const saveCalendarClick = async (e) => {
        e.preventDefault();
        resetErrors();

        // Here you can handle the form submission, e.g., by sending data to an API
        try {
        const response = await fetch(`http://127.0.0.1:8000/calendars/${calendarId}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `token ${token}`,
            },
            body: JSON.stringify({
            name: calendarName,
            description: description,
            // color: color,
            meeting_duration: duration,
            deadline: deadlineDate,
            frequency: frequency,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.detail) {
                alert(errorData.detail);
                router.back();
                return;
            }
            if (errorData.name) {
                addInputErrorStyle("calendar-name");
                setCalendarNameError(errorData.name);
            }
            if (errorData.description) {
                addInputErrorStyle("description");
                setDescriptionError(errorData.description);
            }
            // if (errorData.color) {
            //     addInputErrorStyle("color");
            //     setColorError(errorData.color);
            // }
            if (errorData.meeting_duration) {
                addInputErrorStyle("duration");
                setDurationError(errorData.meeting_duration);
            }
            if (errorData.deadline) {
                addInputErrorStyle("deadline");
                setDeadlineError(errorData.deadline);
            }
            if (errorData.frequency) {
                addInputErrorStyle("frequency");
                setFrequencyError(errorData.frequency);
            }
            throw new Error();
        }

        const data = await response.json();
        console.log(data);
        alert("Changes saved successfully!")
        } catch (error) {
        }
    };

    const deleteCalendarClick = async (e) => {
        e.preventDefault();
        resetErrors();

        // Ask once again if the user is sure to delete the calendar
        if (!confirm("Are you sure you want to delete this calendar?")) {
            return;
        }

        const token = localStorage.getItem("userToken");
        try {
        const response = await fetch(`http://127.0.0.1:8000/calendars/${calendarId}`, {
            method: "DELETE",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.detail);
            throw new Error();
        }

        alert("Calendar deleted successfully!");
        router.push("/home");
        } catch (error) {
        }
    }


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

            <div className="title">Calendar Settings</div>

            <div className="create-container">

            <div className="cal-num">cal {calendarId}</div> 

            <label htmlFor="calendar-name">Calendar Name:</label>
            <input
                type="text"
                name="calendar-name"
                id="calendar-name"
                // Stringify the name
                value={getCalendarAttribute("name").toString()}
                onChange={(e) => setCalendarName(e.target.value)}
            />
            {calendarNameError && <p className={errorStyles.error}>{calendarNameError}</p>}

                <label htmlFor="description">Description:</label>
                <textarea
                    name="description"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                {descriptionError && <p className={errorStyles.error}>{descriptionError}</p>}

                {/* <label htmlFor="color">Color:</label> */}
                {/* <div className="pick-color">
                    <div>Pick calendar color</div>
                    <div className="calendar-color"></div>
                </div> */}
                {/* <input
                    type="color"
                    name="color"
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                />
                {colorError && <p className={errorStyles.error}>{colorError}</p>} */}

                <label htmlFor="duration">Meeting Duration:</label>
                <input
                    type="text"
                    name="duration"
                    id="duration"
                    value={duration}
                    disabled
                />
                {durationError && <p className={errorStyles.error}>{durationError}</p>}

                <label htmlFor="deadline">Deadline:</label>
                <input
                    type="date"
                    name="deadline"
                    id="deadline"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                />
                {deadlineError && <p className={errorStyles.error}>{deadlineError}</p>}

                <label htmlFor="frequency">Frequency:</label>
                <select
                    name="frequency"
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                >
                    <option value="YEARLY">Yearly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                </select>
                {frequencyError && <p className={errorStyles.error}>{frequencyError}</p>}

                {/* This field is not modifiable by the user. When clicked, display message to change the duration if it was automatically closed */}
                <label htmlFor="finalized">Finalized:</label>
                <input
                    type="checkbox"
                    name="finalized"
                    id="finalized"
                    checked={finalized}
                    disabled
                    onClick={() => alert("Please change the deadline to cancel the automatic closure")}
                />

                <div className="bottom-button">

                    <div className="delete" onClick={deleteCalendarClick}>
                    delete
                    </div>
                    
                    <div className="cancel" onClick={router.back}>
                    cancel
                    </div>

                    <div className="submit" onClick={saveCalendarClick}>
                    save
                    </div>

                </div>
            </div>
        </div>
        </div>
    );
    }
