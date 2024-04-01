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
      <div className="page-container">
        <div className="content-container">
          <div className="title">1ON1</div>

          <form id="login-form">
            <p id="login-error-msg"></p>

            <label htmlFor="email">email</label>
            <input type="email" id="email" name="email" required />

            <label htmlFor="password">password</label>
            <input type="password" id="password" name="password" required />

            <div id="login-form-buttons-row">
              <button className="learn-more-button">learn more</button>
              <button className="signup-button" id="login-form-signup-button">
                Sign Up
              </button>
              <button type="submit" className="login-button" id="login-button">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
