"use client";
import Head from "next/head";
import Image from "next/image";
import "./home.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [calendars, setCalendars] = useState([]); // State to store calendar data

  useEffect(() => {
    const fetchCalendars = async () => {
      const token = localStorage.getItem("userToken"); // Or however you're storing your token
      try {
        const response = await fetch("http://127.0.0.1:8000/calendars/list/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${token}`, // Ensure your backend expects a Bearer token
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        console.log(data);
        setCalendars(data); // Assuming the API returns an array of calendars
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        // Handle errors, e.g., by setting error state or displaying a message
      }
    };

    fetchCalendars();

  }, []);

  const logoutClick = async (e) => {
    e.preventDefault();
    router.push("/");
    const token = localStorage.getItem("userToken");
    if (!token) {
      console.error("No token found, user might already be logged out");
      return;
    }

    fetch("http://127.0.0.1:8000/accounts/api/logout/", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        // Add other headers as required by the backend
      },
      // No body is needed for logout, but adjust if your API requires it
    }).then((response) => {
      if (!response.ok) {
        // Handle response not OK, possibly due to expired or invalid token
        throw new Error("Logout failed, please try again");
      }
      // Logout was successful, clear the token from storage
      localStorage.removeItem("userToken"); // Or 'sessionStorage' if you used it
      // Redirect the user or update the UI as needed

      console.log("Logged out successfully");
    });
  };

  const personalClick = () => {
    console.log("personal");
    router.push("/personal");
  };

  const createClick = () => {
    router.push("createCalendar");
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
            <a className="nav-link active">Home</a>

            <a onClick={logoutClick} className="nav-link">
              Logout
            </a>
          </nav>
        </header>

        <div className="title">HOME</div>

        <div className="calendar-gallery">
          {calendars.map((calendar, index) => (
            <div
              key={calendar.id}
              onClick={personalClick}
              className={`calendar-card`}
            >
              <div className={`calendar-number cal2`}>cal {index + 1}</div>
              <div className="calendar-title">{calendar.name}</div>
              <Image
                width={600}
                height={500}
                src="/redirect-arrow.png"
                alt="Redirect Arrow"
                className="redirect-arrow"
              />
            </div>
          ))}

          <div className="calendar-card create-calendar" onClick={createClick}>
            <Image
              width={600}
              height={500}
              src="/arrow.svg"
              alt="Add Calendar"
              className="add-icon"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
