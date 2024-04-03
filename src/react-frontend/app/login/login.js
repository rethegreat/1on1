"use client";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "../styles/account.module.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const router = useRouter();

  const loginClick = async (e) => {
    e.preventDefault();
    setError("");

    const response = await fetch("http://127.0.0.1:8000/accounts/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      setError("Login failed");
      return;
    }

    const data = await response.json();
    console.log("Login successful:", data);
    localStorage.setItem('userToken', data.token);
    router.push("/home");
  };

  const signupClick = () => {
    router.push("/signup");
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
          <div className={styles.label}>username</div>
          <input
            type="text"
            value={username}
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
          <div className={styles.buttonContainer}>
            <div>
              <button onClick={signupClick} className={styles.whiteButton}>
                Sign Up
              </button>
            </div>
            <div>
              <button onClick={loginClick} className={styles.blueButton}>
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
