"use client";
import Head from "next/head";
import Image from "next/image";
import "./personal.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PersonalPage() {
  const router = useRouter();

  const [calendar, setCalendar] = useState(0);

  const [title, setTitle] = useState("");

  useEffect(() => {
    const storedCalendar = localStorage.getItem("currentCalendar");
    const id = JSON.parse(storedCalendar).id;
    setCalendar(id);
  }, []);
  
  useEffect(() => {
    if (calendar) {
      const fetchAvailability = async () => {
        const token = localStorage.getItem("userToken");
        try {
          const response = await fetch(
            `http://127.0.0.1:8000/calendars/${calendar}/`,
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
          setTitle(data.name);
        } catch (error) {
          console.error("Failed to fetch availability:", error);
        }
      };

      fetchAvailability();
    }
  }, [calendar]);

  const availabilityClick = () => {
    console.log("personal");
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
      <div className="main">
        <header>
          <a className="logo">1on1</a>
          <nav>
            <a href="/home" className="nav-link">
              Home
            </a>
            <a href="/" onClick={logoutClick} className="nav-link">
              Logout
            </a>
          </nav>
        </header>
        <div className="title personal">
          {title}
          <img src="/settings.svg" alt="Settings" className="settings"
          onClick={() => router.push("/personal/settings")} />
        </div>
          

        <div className="calendar-gallery">
          <div className="calendar-card cal1-card" onClick={availabilityClick}>
            <div className="calendar-title">own availability</div>
            <Image
              width={500}
              height={500}
              src="/redirect-arrow.png"
              alt="Redirect Arrow"
              className="redirect-arrow"
            />
          </div>

          <div className="calendar-card cal2-card" onClick={memberClick}>
            <div className="calendar-title">manage members</div>
            <Image
              width={500}
              height={500}
              src="/redirect-arrow.png"
              alt="Redirect Arrow"
              className="redirect-arrow"
            />
          </div>

          <div className="calendar-card cal3-card" onClick={scheduleClick}>
            <div className="calendar-title">view calendar</div>
            <Image
              width={500}
              height={500}
              src="/redirect-arrow.png"
              alt="Redirect Arrow"
              className="redirect-arrow"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
