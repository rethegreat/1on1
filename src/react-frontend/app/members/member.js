import Head from "next/head";
import Image from "next/image";
import styles from "./member.module.css"; // Import the CSS module

export default function MemberPage() {
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
          href="../home-personal/personal-completed.html"
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
              <label className={styles.label} htmlFor="name">name</label>
              <input
                className={styles.input}
                type="text"
                id="name"
                name="name"
                required
              />
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
