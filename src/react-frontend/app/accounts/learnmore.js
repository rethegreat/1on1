import Head from "next/head";
import "./learnmore.css";

export default function LearnMore() {
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
      <div>
        <div class="nav-back">
          <button
            onclick="window.location.href='login.html'"
            class="back-button"
          >
            &lt; back
          </button>
        </div>

        <div class="screen-card screen-card-1">
          {/* <img class="value-prop" src="vp1.png" alt=""> */}
          <div class="welcome-text">
            <h1>Effortless Meet-ups</h1>
            <div class="p-container">
              <p>
                Ditch the calendar Tetris! Our app takes the headache out of
                scheduling one-on-one meetings. Just pick your preferred time,
                and we'll handle the rest, ensuring your meet-ups are smooth and
                stress-free.
              </p>
            </div>
          </div>
        </div>
        <div class="screen-card screen-card-2">
          {/* <img style="max-height: 50vw; width: auto;" class="value-prop" src="vp2.png" alt=""> */}
          <div class="welcome-text">
            <h1>Time-Savvy Scheduler</h1>
            <div class="p-container">
              <p>
                Tired of wasted hours coordinating schedules? Our app is your
                time-savvy ally. It not only books your meetings but ensures
                they fit seamlessly into your busy day. Regain control of your
                time and make every meeting count.
              </p>
            </div>
          </div>
        </div>
        <div class="screen-card screen-card-3">
          {/* <img class="value-prop" style="max-height: 50vw; width: auto;" src="vp3.png" alt=""> */}
          <div class="welcome-text">
            <h1>Networking Sidekick</h1>
            <div class="p-container">
              <p>
                Hate small talk? Let our app be your networking wingman.
                Automatically send out meeting invites. Say goodbye to awkward
                intros and hello to purposeful connections effortlessly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
