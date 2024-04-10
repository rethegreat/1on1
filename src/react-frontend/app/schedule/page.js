"use client";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addDays, startOfWeek, format, parseISO, set } from "date-fns";
import "./schedule.css";
import styles from "./schedule.module.css";

export default function Schedule() {
  const router = useRouter();
  const [calendarId, setCalendarId] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [remindMessage, setRemindMessage] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [pageTotal, setPageTotal] = useState(0);
  const [scheduleId, setScheduleId] = useState(0);
  const [events, setEvents] = useState([]);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [isEditClicked, setIsEditClicked] = useState(false);
  const [isCalendarFinalized, setCalendarFinalized] = useState(false);
  const [exist, setExist] = useState(false);

  // 0. Set the current calendar ID + Set up blnak schedule
  useEffect(() => {
    const storedCalendar = localStorage.getItem("currentCalendar");
    const id = JSON.parse(storedCalendar).id;
    setCalendarId(id);
    // if localStorage has defined(not undefined) currentPageNum, set pageNum to the value
    if (localStorage.getItem("currentPageNum")) {
      // try parsing
      const parsedPageNum = parseInt(localStorage.getItem("currentPageNum"));
      // if the parsing is successful, set pageNum to the value
      if (!isNaN(parsedPageNum)) {
        setPageNum(parsedPageNum);
        localStorage.removeItem("currentPageNum");
      }
    }
    setSchedule(generateScheduleWithDates());
  }, []);

  // 1. Parse the response data
  useEffect(() => {
    if (calendarId) {
      const fetchSchedule = async () => {
        const token = localStorage.getItem("userToken");
        try {
          const response = await fetch(
            `https://1on1-django.fly.dev/calendars/${calendarId}/schedules/?page=${pageNum}`,
            {
              method: "GET",
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              `Error: ${response.statusText} - ${errorData.error}`
            );
          }
          const data = await response.json();
          console.log(data);

          setPageTotal(data.count);
          setCalendarFinalized(data.finalized);
          if (data.count != 0) {
            setExist(true);
            setScheduleId(data.results[0].id);
            setEvents(data.results[0].events);
          }
        } catch (error) {
          console.error(error);
        }
      };

      const getMembers = async () => {
        const token = localStorage.getItem("userToken");
        const response = await fetch(
          `https://1on1-django.fly.dev/calendars/${calendarId}/members/list/`,
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
          setRemindMessage("");
        } else {
          setRemindMessage(
            data[0].num_pending +
              " users have not submitted their availability yet"
          );
        }
      };

      setSchedule(generateScheduleWithDates());
      fetchSchedule();
      getMembers();
    }
  }, [calendarId, pageNum]);

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
        const priority = obj["pref_choice"];

        if (priority == "HIGH") {
          grouped[key].slots.push({
            time: time,
            color: "#DD7800", // "#CCDD00", (green)
            name: member_name,
            member_id: member_id,
            member_email: member_email,
          });
        } else {
          grouped[key].slots.push({
            time: time,
            color: "#CCDD00", // green
            name: member_name,
            member_id: member_id,
            member_email: member_email,
          });
        }
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
          const newPart = filteredNewParts.find(
            (part) => part.date === sch.date
          );
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
    const url = `https://1on1-django.fly.dev/calendars/${calendarId}/remindAll/`;
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

  const remindAllAdd = async () => {
    const token = localStorage.getItem("userToken");
    const url = `https://1on1-django.fly.dev/calendars/${calendarId}/remindAdd/`;
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
  };

  const goToNextPage = () => {
    if (pageNum < pageTotal) {
      setPageNum(pageNum + 1);
    } else {
      alert("You are already on the last page");
    }
  };

  // ========================================================================================================
  // =============================================== EDIT =================================================
  const handleAction = async (action) => {
    // After handling action(which may route to different pages), we should come back to where we are now
    // Save the current URL
    localStorage.setItem("scheduleId", scheduleId);
    localStorage.setItem("currentPageNum", pageNum);

    switch (action) {
      case "add":
        // Go to the page("/schedule/edit/add/memberSelect/page.js"- default export)
        // where the user can select a member for this new meeting
        // This page will ask the user to select a member then lead to another page for the time, and then it will call addMeeting at the end
        router.push("/schedule/edit/add/memberSelect");
        break;
      case "delete":
        router.push("/schedule/edit/delete");
        break;
      case "move":
        router.push("/schedule/edit/move");
        break;
      default:
        console.error("Invalid action");
    }
  };

  // ========================================================================================================

  // ========================================================================================================
  // ============================================== FINALIZE ================================================

  const finalizeClick = () => {
    if (
      confirm(
        "Are you sure you want to finalize the calendar with this schedule?"
      )
    ) {
      setRemindMessage("Finalized Schedule");
      finalizeSchedule(
        localStorage.getItem("userToken"),
        calendarId,
        scheduleId
      );
    }
  };

  const finalizeSchedule = async (token, calendarId, scheduleId) => {
    const url = `https://1on1-django.fly.dev/calendars/${calendarId}/schedules/${scheduleId}/`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        // Whatever the key is in the data, get its value and alert it
        alert(Object.values(data)[0]);
      } else {
        const message = data.detail;
        alert(message);
        localStorage.setItem("currentPageNum", 1);
        router.push("/schedule");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ========================================================================================================

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

          {!exist ? (
            <div className="mapping-error">
              <div className="mapping-text">
                No mapping possible, please add more availabilities and remind
                users to update their availabilities
              </div>
              <div className="remind" onClick={remindAllAdd}>
                remind
              </div>
            </div>
          ) : !isCalendarFinalized ? (
            remindMessage && (
              <div className="missing">
                <div className="missing-text">{remindMessage}</div>
                <div className="remind" onClick={remindAll}>
                  remind
                </div>
              </div>
            )
          ) : (
            <div className="finalized">Finalized Schedule</div>
          )}

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
                            <div
                              style={{ textAlign: "center", fontSize: "14px" }}
                            >
                              <div>{getSlotMemberName(slot)}</div>
                              <div
                                style={{ color: "lightgray", fontSize: "13px" }}
                              >
                                {getSlotMemberEmail(slot)}
                              </div>
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

          {!isCalendarFinalized && (
            <div className={`${styles["bottom"]}`}>
              {/* ================================== EDIT-BUTTON ============================== */}
              {isEditClicked ? (
                <div className={`${styles["edit-box"]}`}>
                  <div
                    className={`${styles["edit-button"]} + " " + ${styles["clicked-button"]}`}
                    onClick={() => setIsEditClicked(!isEditClicked)}
                  >
                    edit
                  </div>

                  <div className={`${styles["action-button-box"]}`}>
                    <div
                      className={`${styles["add-event-button"]}`}
                      onClick={() => handleAction("add")}
                    >
                      Add Meeting
                    </div>
                    <div
                      className={`${styles["move-event-button"]}`}
                      onClick={() => handleAction("move")}
                    >
                      Move Meeting
                    </div>
                    <div
                      className={`${styles["delete-event-button"]}`}
                      onClick={() => handleAction("delete")}
                    >
                      Delete Meeting
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`${styles["edit-button"]}`}
                  onClick={() => setIsEditClicked(!isEditClicked)}
                >
                  edit
                </div>
              )}

              {/* ================================== ARROWS ============================== */}

              <div className={`${styles.page}`}>
                <div className={`${styles.arrow}`} onClick={goToPreviousPage}>
                  &lt;
                </div>
                <div>
                  {pageNum}/{pageTotal}
                </div>
                <div className={`${styles.arrow}`} onClick={goToNextPage}>
                  &gt;
                </div>
              </div>

              {/* ================================== FINALIZE-BUTTON ============================== */}
              <div className={`${styles.submit}`} onClick={finalizeClick}>
                finalize
              </div>
              {/* ================================================================ */}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
