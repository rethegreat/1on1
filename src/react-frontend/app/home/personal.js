import Head from "next/head";
import Image from "next/image";
import "./home.css";

export default function PersonalPage() {
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
      <div class="main">

            <header>
                <a class="logo">1on1</a>
                <nav>
                    <a href="home.html" class="nav-link">Home</a>
                    <a href="../login-signup/login.html" class="nav-link">Logout</a>
                </nav>
            </header>


            <div class="title personal">Personal</div>

            <div class="calendar-gallery">
                <div class="calendar-card cal1-card" >
                    <div class="calendar-title">own availability</div>
                    <Image width={500} height={500} src="/redirect-arrow.png" alt="Redirect Arrow" class="redirect-arrow" />
                </div>

                <div class="calendar-card cal2-card" >
                    <div class="calendar-title">manage members</div>
                    <Image width={500} height={500} src="/redirect-arrow.png" alt="Redirect Arrow" class="redirect-arrow" />
                </div>

                <div class="calendar-card cal3-card" >
                    <div class="calendar-title">view calendar</div>
                    <Image width={500} height={500} src="/redirect-arrow.png" alt="Redirect Arrow" class="redirect-arrow" />
                </div>
        
            </div>


        </div>
    </div>
  );
}