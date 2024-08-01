"use client";
import Head from "next/head";
import Image from "next/image";
import styles from "../../../../styles/member.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// 1. Display all members in the calendar
// 2. Ask the user to select a member
// 3. Set the member_id

export default function MeetingMember() {
    const router = useRouter();
    const [calendar, setCalendar] = useState(0);
    const [members, setMembers] = useState([]);

    useEffect(() => {
        const storedCalendar = localStorage.getItem("currentCalendar");
        const id = JSON.parse(storedCalendar).id;
        setCalendar(id);
    }, []);

    useEffect(() => {
      if (calendar) {
        const getMembers = async () => {
            const token = localStorage.getItem("userToken");
            const response = await fetch(
                `https://1on1-django.fly.dev/calendars/${calendar}/members/list/`,
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
            data = data.slice(1);
            setMembers(data);
        };
        getMembers();
      }
    }, [calendar]);

    const selectMember = (memberId) => {
        localStorage.setItem("selectedMemberId", memberId);
        router.push(`/schedule/edit/add/timeSelect`);
    }

    const pendingMemberClick = () => {
      if (confirm("This member has not submitted their availability. Would you like to send them a reminder email again?")) {
        // Send reminder email
        if (confirm("Reminder email sent successfully! Would you like to select another member?")) {
          return;
        } else {
          confirm("Would you like to return to the schedule page?");
          router.push("/schedule");
        }
      } else {
        if (confirm("Would you like to continue editing the schedule?")) {
          return;
        } else {
          router.push("/schedule");
        }
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
          <div className={styles.main}>
            <a className={styles.back} href="/schedule">
              {" "}
              &lt; cancel
            </a>
    
            <div className={styles.heading}>
              <h1 className={styles.title}>select member</h1>
            </div>
    
            {members.map((member, index) => (
              <div key={index} className={styles.card}>
                <div className={styles.address}>
                  <div className={styles.circleContainer}>
                    {member.submitted ? (
                      <div className={styles.circleGreen}></div>
                    ) : (
                      <div className={styles.circleOrange}></div>
                    )}
                    {member.submitted ? <div>submitted</div> : <div>pending</div>}
                  </div>
                  <div className={styles["text-stack"]}>
                    <p className={styles.font}>{member.name}</p>
                    <p className={styles.font}>{member.email}</p>
                  </div>
                </div>
    
                <div className={styles.buttons}>
                  {
                    member.submitted ?
                    (<div
                      className={styles.remind}
                      onClick={() => selectMember(member.id)}
                      >select
                    </div>)
                    :
                    (<div
                      className={styles.delete}
                      style={{backgroundColor: "gray", color: "lightgray", border: "1px solid lightgray"}}
                      onClick={pendingMemberClick}
                      >
                      remind
                    </div>)
                  }
                </div>
              </div>
            ))}
    
          </div>
        </div>
      );
}
