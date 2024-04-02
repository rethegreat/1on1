"use client";
import Head from "next/head";
import styles from "../styles/account.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "../globals.css";

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const signupClick = async () => {
    setError("");

    const signupData = { first_name, last_name, email, username, password };

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/accounts/api/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(signupData),
        }
      );

      if (!response.ok) {

        throw new Error("Signup failed");
      }

      const data = await response.json();
      console.log("Signup successful", data.token);
      localStorage.setItem('userToken', data.token);
      router.push("/home");
    } catch (error) {
      console.error("Signup error:", error);
      setError(error.message);
    }
  };

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
      <div className={styles.signupContainer}>
        <div className={styles.title}>1ON1</div>

        <div className={styles.form}>
          <div className={styles.label}>first name</div>
          <input
            className={styles.formInput}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <div className={styles.label}>last name</div>
          <input
            className={styles.formInput}
            onChange={(e) => setLastName(e.target.value)}
          />
          <div className={styles.label}>email</div>
          <input
            className={styles.formInput}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className={styles.label}>username</div>
          <input
            className={styles.formInput}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div className={styles.label}>password</div>
          <input
            type="password"
            value={password}
            className={styles.formInput}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}
          <div>
            <button onClick={signupClick} className={styles.whiteButton}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
