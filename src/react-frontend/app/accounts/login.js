import Head from "next/head";
import "./account.css";

export default function Login() {
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
      <div class="page-container">
        <div class="content-container">
          <div class="title">1ON1</div>

          <form id="login-form">
            <p id="login-error-msg"></p>

            <label for="email">email</label>
            <input type="email" id="email" name="email" required />

            <label for="password">password</label>
            <input type="password" id="password" name="password" required />

            <div id="login-form-buttons-row">
              <button
                class="learn-more-button"
                onclick="window.location.href='learn-more.html'"
              >
                learn more
              </button>
              <button
                class="signup-button"
                id="login-form-signup-button"
                onclick="window.location.href='signup.html'"
              >
                Sign Up
              </button>
              <button type="submit" class="login-button" id="login-button">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
