"use client";
import Head from "next/head";
import Image from "next/image";
import "./notification.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotifPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]); 

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'};
    return new Date(dateString).toLocaleString('en-US', options);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("userToken"); 
      try {
        const response = await fetch("http://127.0.0.1:8000/notifications/list/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        console.log(data);
        setNotifications(data); // Assuming the API returns an array of calendars

        await readNotif();
      } catch (error) {
        console.error("Error fetching notification data:", error);
        // Handle errors, e.g., by setting error state or displaying a message
      }
    };

    fetchNotifications();
  }, []);

  const readNotif = async () => {
    const token = localStorage.getItem("userToken"); 
    try {
      const response = await fetch("http://127.0.0.1:8000/notifications/list/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error("Error set as read for notification data:", error);
      // Handle errors, e.g., by setting error state or displaying a message
    }
  }

  const backClick = () => {
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
      <div className="main">
        <div className="back" onClick={backClick}>
          &lt; back
        </div>

        <div className="title">Notification</div>

        <div className="notification-gallery">
          {notifications.map((notif, index) => (
            notif.read_status ? (
              <div className="notification-card-unread">
                <p className="notif-text">{notif.message}
                { notif.link &&
                  <a className="notif-link" href={notif.link} target="_blank" rel="noopener noreferrer"> link</a>
                }
                </p>
                <p className="notif-time">{formatDate(notif.created_at)}</p>
              </div>
            ) : (
              <div className="notification-card-read">
                <p className="notif-text">{notif.message}
                { notif.link &&
                  <a className="notif-link" href={notif.link} target="_blank" rel="noopener noreferrer"> link</a>
                }
                </p>
                <p className="notif-time">{formatDate(notif.created_at)}</p>
              </div>
            )))}
        </div>
      </div>
    </div>
  );
}
