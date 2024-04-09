"use client";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../styles/account.module.css";
import errorStyles from "../styles/error.module.css";
import { addInputErrorStyle, removeInputErrorStyle } from "../utils/errorHandling";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Reset errors and input field styles
  // This function is called before every function call below
  const resetErrors = () => {
    setError("");
    removeInputErrorStyle("username");
    removeInputErrorStyle("password");
    setUsernameError("");
    setPasswordError("");
  };

  const loginClick = async (e) => {
    e.preventDefault();
    resetErrors();
    try {
      const response = await fetch("http://1on1-django.fly.dev/accounts/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.username || errorData.password) {
          if (errorData.username) {
            setUsernameError(errorData.username);
            addInputErrorStyle("username");
          }
          if (errorData.password) {
            setPasswordError(errorData.password);
            addInputErrorStyle("password");
          }
        } 
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      localStorage.setItem('userToken', data.token);
      router.push("/home");
    } catch (error) {
      setError("Invalid credentials");
    }
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
            id="username"
          />
          <div className={styles.error + " " + errorStyles.error}>{usernameError}</div>
          <div className={styles.label}>password</div>
          <input
            type="password"
            value={password}
            className={styles.formInput}
            onChange={(e) => setPassword(e.target.value)}
            id="password"
          />
          <div className={styles.error + " " + errorStyles.error}>{passwordError}</div>
          {error && <div className={styles.error + " " + errorStyles.error}>{error}</div>}
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
