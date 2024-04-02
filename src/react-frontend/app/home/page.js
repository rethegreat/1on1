'use client'
import Head from "next/head";
import Image from "next/image";
import "./home.css";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter()

  const logoutClick = () => {
    console.log('logout')
  };

  const personalClick = () => {
    console.log('personal')
    router.push('/personal')
  }

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
      <div className="main">
        <header>
          <a className="logo">1on1</a>
          <nav>
            <a className="nav-link active">Home</a>

            <a onClick={logoutClick} href="/" className="nav-link">
              Logout
            </a>
          </nav>
        </header>

        <div className="title">HOME</div>

        <div className="calendar-gallery">
          <div onClick={personalClick} className="calendar-card cal1-card">
            <div className="calendar-number cal1">cal 1</div>
            <div className="calendar-title">Work</div>
            <Image
              width={600}
              height={500}
              src="/redirect-arrow.png"
              alt="Redirect Arrow"
              className="redirect-arrow"
            />
          </div>

          <div className="calendar-card cal2-card">
            <div className="calendar-number cal2">cal 2</div>
            <div className="calendar-title">Personal</div>
            <Image
              width={600}
              height={500}
              src="/redirect-arrow.png"
              alt="Redirect Arrow"
              className="redirect-arrow"
            />
          </div>

          <div className="calendar-card cal3-card">
            <div className="calendar-number cal3">cal 3</div>
            <div className="calendar-title">CSC309</div>
            <Image
              width={600}
              height={500}
              src="/redirect-arrow.png"
              alt="Redirect Arrow"
              className="redirect-arrow"
            />
          </div>

          <div className="calendar-card create-calendar">
            <Image
              width={600}
              height={500}
              src="/arrow.svg"
              alt="Add Calendar"
              className="add-icon"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
