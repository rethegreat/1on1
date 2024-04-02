'use client'
import Head from "next/head";
import { useRouter } from "next/navigation";
import "./schedule.css";

export default function Schedule() {

  const router = useRouter()

  const backClick = () => {
    router.push('/personal')
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
      <div className="calendar-body">
        <div className="calendar-main">
          <div className="back" onClick={backClick}>&lt; back</div>

          <div className="header pink">schedule</div>

          <div className="missing">
            <div className="missing-text">
              2 users have not submitted their schedules
            </div>
            <div className="remind">remind</div>
          </div>

          <div className="calendar">
            <div className="content">
              <div className="time">
                <div className="spacer"></div>
                <div>09:00</div>
                <div>09:30</div>
                <div>10:00</div>
                <div>10:30</div>
                <div>11:00</div>
                <div>11:30</div>
                <div>12:00</div>
                <div>12:30</div>
                <div>01:00</div>
                <div>01:30</div>
                <div>02:00</div>
                <div>02:30</div>
                <div>03:00</div>
                <div>03:30</div>
                <div>04:00</div>
                <div>04:30</div>
              </div>

              <div className="day">
                <div className="label">Mon</div>

                <div className="column"></div>
              </div>

              <div className="day">
                <div className="label">Tue</div>
                <div className="column">
                  <div className="column-spacer"></div>
                  <div className="column small orange name">Irene</div>
                </div>
              </div>
              <div className="day">
                <div className="label">Wed</div>
                <div className="column"></div>
              </div>
              <div className="day">
                <div className="label">Thu</div>
                <div className="column"></div>
              </div>
              <div className="day">
                <div className="label">Fri</div>
                <div className="column"></div>
              </div>
              <div className="day">
                <div className="label">Sat</div>
                <div className="column"></div>
              </div>
              <div className="day">
                <div className="label">Sun</div>
                <div className="column">
                  <div className="column large cyan name">Kurtis</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bottom">
            <div style={{ width: "150px" }}></div>
            <div className="page">
              <div className="arrow">&lt;</div>
              <div>1/3</div>
              <div className="arrow">&gt;</div>
            </div>
            <div className="bottom-button">
              <div className="cancel" onClick={backClick}>cancel</div>
              <div className="submit">submit</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
