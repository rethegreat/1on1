"use client";
import Head from "next/head";
import Image from "next/image";
import styles from "../../styles/personal.module.css";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function CalendarDetail() {
  const router = useRouter();
  const pathname = usePathname();
  const [calendarId, setCalendarId] = useState(0);
  const [calendar, setCalendar] = useState(null);

  // Set calendarId from pathname
  useEffect(() => {
    console.log(pathname);

    const parts = pathname.split("/");
    const calendarId = parts[2];

    setCalendarId(calendarId);
    console.log(calendarId);

    // Get the calendar object
    const getCalendar = async () => {
      const token = localStorage.getItem("userToken");
      const response = await fetch(
        `http://127.0.0.1:8000/calendars/${calendarId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail);
        // Redirect back
        router.back();
      }

      const data = await response.json();
      console.log(data);
      setCalendar(data);
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

  // ============== When Clicked ==============

  const availabilityClick = () => {
    router.push("/availability");
  };

  const scheduleClick = () => {
    router.push("/schedule");
  };

  const logoutClick = () => {
    console.log("call logout");
  };

  const memberClick = () => {
    router.push("/member");
  };

  const settingsClick = () => {
    // go to settings page of this calendar(only in the front end)
    router.push(`/calendars/${calendarId}/settings`);
  };
  
  // =========================================

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
      <div className={styles.main}>
        <header className={styles.header}>
          <a className={styles.logo}>1on1</a>
          <nav className={styles.nav}>
            <a href="/home" className={styles["nav-link"]}>
              Home
            </a>
            <a href="/" onClick={logoutClick} className={styles["nav-link"]}>
              Logout
            </a>
          </nav>
        </header>

        {/* Display calendar.name as a title */}
        <div className={styles.title + " " + styles.personal}>{getCalendarAttribute("name")}</div>

        <div className={styles["calendar-gallery"]}>
          <div className={styles["calendar-card"] + " " + styles["cal1-card"]} onClick={availabilityClick}>
            <div className={styles["calendar-title"]}>own availability</div>
            <Image
              width={500}
              height={500}
              src="/redirect-arrow.png"
              alt="Redirect Arrow"
              className={styles["redirect-arrow"]}
            />
          </div>

          <div className={styles["calendar-card"] + " " + styles["cal2-card"]} onClick={memberClick}>
            <div className={styles["calendar-title"]}>manage members</div>
            <Image
              width={500}
              height={500}
              src="/redirect-arrow.png"
              alt="Redirect Arrow"
              className={styles["redirect-arrow"]}
            />
          </div>

          <div className={styles["calendar-card"] + " " + styles["cal3-card"]} onClick={scheduleClick}>
            <div className={styles["calendar-title"]}>view calendar</div>
            <Image
              width={500}
              height={500}
              src="/redirect-arrow.png"
              alt="Redirect Arrow"
              className={styles["redirect-arrow"]}
            />
          </div>

          <div className={styles["calendar-card"] + " " + styles["cal3-card"]} onClick={settingsClick}>
            <div className={styles["calendar-title"]}>settings</div>
            <Image
              width={500}
              height={500}
              src="/redirect-arrow.png"
              alt="Redirect Arrow"
              className={styles["redirect-arrow"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
