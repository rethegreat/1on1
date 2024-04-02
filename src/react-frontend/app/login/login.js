'use client'
import Head from "next/head";
import { useRouter } from "next/navigation";

import styles from "../styles/account.module.css";

export default function Login() {
  const router = useRouter()

  const loginClick = () => {
    router.push('/home');
  };

  const signupClick = () => {
    router.push('/signup');
  }

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
          <div className={styles.label}>password</div>
          <input className={styles.formInput} />

          <div className={styles.buttonContainer}>
            <div>
              <button onClick={signupClick} className={styles.whiteButton}>Sign Up</button>
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
