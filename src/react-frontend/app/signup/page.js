"use client";
import Head from "next/head";
import styles from "../styles/account.module.css";
import { useRouter } from "next/navigation";
import "../globals.css";

export default function Signup() {
  const router = useRouter();

  const signupClick = () => {
    router.push("/home");
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
          <div className={styles.label}>email</div>
          <input className={styles.formInput} />
          <div className={styles.label}>name</div>
          <input className={styles.formInput} />
          <div className={styles.label}>password</div>
          <input className={styles.formInput} />
          <div className={styles.label}>confirm password</div>
          <input className={styles.formInput} />
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
