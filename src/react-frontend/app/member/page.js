"use client";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/member.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MemberPage() {
  const router = useRouter();

  const [calendar, setCalendar] = useState(0);

  const [members, setMembers] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [refreshMembers, setRefreshMembers] = useState(0);

  useEffect(() => {
    const storedCalendar = localStorage.getItem("currentCalendar");
    const id = JSON.parse(storedCalendar).id;
    setCalendar(id);
  }, []);

  useEffect(() => {
    if (calendar > 0) {
      const getMembers = async () => {
        const token = localStorage.getItem("userToken");
        const response = await fetch(
          `http://127.0.0.1:8000/calendars/${calendar}/members/list/`,
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
        console.log(data);
      };
      getMembers();
    }
  }, [calendar, refreshMembers]);

  const handleAddMember = async () => {
    const endpoint = `http://127.0.0.1:8000/calendars/${calendar}/members/list/`;
    const memberData = { name, email };

    const token = localStorage.getItem("userToken");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify(memberData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setName("");
      setEmail("");
      setRefreshMembers((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  };

  const handleRemindMember = async (memberId) => {
    const endpoint = `http://127.0.0.1:8000/calendars/${calendar}/members/${memberId}/`;
    const actionData = { action: "remind" };

    const token = localStorage.getItem("userToken");

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(actionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Remind action successful:", result);
    } catch (error) {
      console.error("Failed to remind member:", error);
    }
  };

  const handleDeleteMember = async (memberId) => {
    const endpoint = `http://127.0.0.1:8000/calendars/${calendar}/members/${memberId}/`;
    const token = localStorage.getItem("userToken");
  
    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      console.log("Member deleted successfully");
      setRefreshMembers((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
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
      <div className={styles.main}>
        <a className={styles.back} href="/personal">
          {" "}
          &lt; back
        </a>

        <div className={styles.heading}>
          <h1 className={styles.title}>members</h1>
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
              <div
                className={styles.remind}
                onClick={() => handleRemindMember(member.id)}
              >
                <p>remind</p>
              </div>
              <div
                className={styles.delete}
                onClick={() => handleDeleteMember(member.id)}
              >
                <p>remove</p>
              </div>
            </div>
          </div>
        ))}

        <div className={styles.add}>
          <div className={styles.newcard}>
            <form id="add-member-form">
              <div>
                <label className={styles.label} htmlFor="name">
                  name
                </label>
                <input
                  className={styles.input}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  id="name"
                  name="name"
                  required
                />
              </div>
              <div style={{ marginTop: "20px" }}>
                <label className={styles.label} htmlFor="email">
                  email
                </label>
                <input
                  className={styles.input}
                  onChange={(e) => setEmail(e.target.value)}
                  type="text"
                  id="email"
                  name="email"
                  required
                />
              </div>
            </form>
          </div>
          <div
            className={styles.plus}
            id="plus-button"
            onClick={handleAddMember}
          >
            <Image
              className={styles.image}
              width={150}
              height={150}
              src="/arrow.svg"
              alt=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}
