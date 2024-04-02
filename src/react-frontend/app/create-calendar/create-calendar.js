import Head from "next/head";
import Image from "next/image";
import "./create-calendar.css";

export default function CreateCalendar() {
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
      <div className="cc-main">
        <header>
          <a className="logo">1on1</a>
          <nav>
            <a className="nav-link active">Home</a>

            <a href="../login-signup/login.html" className="nav-link">
              Logout
            </a>
          </nav>
        </header>

        <div className="title">New Calendar</div>

        <div className="create-container">
          <div className="cal-num">cal 3</div>
          <input
            type="text"
            name="calendar-name"
            placeholder="enter calendar name"
          />
          <div className="pick-color">
            <div>Pick calendar color</div>
            <div className="calendar-color"></div>
          </div>
          <input type="text" placeholder="set deadline date" />

          <div className="bottom-button">
            <div className="cancel">cancel</div>
            <div
              className="submit"
              onclick="window.location.href='home-f1.html'"
            >
              done
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
