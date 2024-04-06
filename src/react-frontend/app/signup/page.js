"use client";
import Head from "next/head";
import styles from "../styles/account.module.css";
import errorStyles from "../styles/error.module.css";
import { addInputErrorStyle, removeInputErrorStyle } from "../utils/errorHandling";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "../globals.css";
import { add } from "date-fns";

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  // const [error, setError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Reset errors and input field styles
  const resetErrors = () => {
    // setError("");
    removeInputErrorStyle("first_name");
    removeInputErrorStyle("last_name");
    removeInputErrorStyle("email");
    removeInputErrorStyle("username");
    removeInputErrorStyle("password");
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setUsernameError("");
    setPasswordError("");
  };

  const signupClick = async () => {
    resetErrors();

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
        // Parse the response body as JSON
        const errorData = await response.json();
        if (errorData.first_name || errorData.last_name || errorData.email || errorData.username || errorData.password) {
          if (errorData.first_name) {
            addInputErrorStyle("first_name");
            setFirstNameError(errorData.first_name);
          }
          if (errorData.last_name) {
            addInputErrorStyle("last_name");
            setLastNameError(errorData.last_name);
          }
          if (errorData.email) {
            addInputErrorStyle("email");
            setEmailError(errorData.email);
          }
          if (errorData.username) {
            addInputErrorStyle("username");
            setUsernameError(errorData.username);
          }
          if (errorData.password) {
            addInputErrorStyle("password");
            setPasswordError(errorData.password);
          }
        }
        throw new Error("Please check the fields and try again");
      }

      const data = await response.json();
      console.log("Signup successful", data.token);
      localStorage.setItem('userToken', data.token);
      router.push("/home");
    } catch (error) {
      // console.error("Signup error:", error);
      // setError(error.message);
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
            id="first_name"
          />
          { firstNameError && <div className={styles.error + " " + errorStyles.error}>{firstNameError}</div>}
          <div className={styles.label}>last name</div>
          <input
            className={styles.formInput}
            onChange={(e) => setLastName(e.target.value)}
            id="last_name"
          />
          { lastNameError && <div className={styles.error + " " + errorStyles.error}>{lastNameError}</div>}
          <div className={styles.label}>email</div>
          <input
            className={styles.formInput}
            onChange={(e) => setEmail(e.target.value)}
            id="email"
          />
          { emailError && <div className={styles.error + " " + errorStyles.error}>{emailError}</div>}
          <div className={styles.label}>username</div>
          <input
            className={styles.formInput}
            onChange={(e) => setUsername(e.target.value)}
            id="username"
          />
          { usernameError && <div className={styles.error + " " + errorStyles.error}>{usernameError}</div>}
          <div className={styles.label}>password</div>
          <input
            type="password"
            value={password}
            className={styles.formInput}
            onChange={(e) => setPassword(e.target.value)}
            id="password"
          />
          <div className={styles.error + " " + errorStyles.error}>{passwordError}</div>
          {/* { error && <div className={styles.error + " " + errorStyles.error}>{error}</div>} */}
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
