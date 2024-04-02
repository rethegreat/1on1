'use client'
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/member.module.css"; 
import { useRouter } from "next/navigation";

export default function MemberPage() {
  const router = useRouter()

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
        <a
          className={styles.back}
          href="/personal"
        >
          {" "}
          &lt; back
        </a>

        <div className={styles.heading}>
          <h1 className={styles.title}>members</h1>
        </div>

        <div className={styles.card}>
          <div className={styles.circle}>
            <p className={styles.pending}>pending</p>
          </div>

          <div className={styles.address}>
            <div className={styles["text-stack"]}>
              <p className={styles.font}>Cool Guy</p>
              <p className={styles.font}>coolestguy@utoronto.ca</p>
            </div>
          </div>

          <div className={styles.buttons}>
            <div className={styles.remind}>
              <p>remind</p>
            </div>
            <div className={styles.delete}>
              <p>remove</p>
            </div>
          </div>
        </div>

        <div className={styles.add}>
          <div className={styles.newcard}>
            <form id="add-member-form">
              <div>
                <label className={styles.label} htmlFor="name">
                  name
                </label>
                <input
                  className={styles.input}
                  type="text"
                  id="name"
                  name="name"
                  required
                />
              </div>
              <div style={{ marginTop : "20px"}}>
                <label className={styles.label} htmlFor="email">
                  email
                </label>
                <input
                  className={styles.input}
                  type="text"
                  id="email"
                  name="email"
                  required
                />
              </div>
            </form>
          </div>
          <div className={styles.plus} id="plus-button">
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
