import Head from "next/head";
import "./account.css";

export default function Signup() {
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

          <form id="signup-form">
            <p id="signup-error-msg"></p>

            <label for="name">name</label>
            <input type="text" id="name" name="name" required />

            <label for="email">email</label>
            <input type="text" id="email" name="email" required />

            <label for="password">password</label>
            <input type="password" id="password" name="password" required />

            <label for="password-confirm">confirm password</label>
            <input
              type="password"
              id="password-confirm"
              name="password-confirm"
              required
            />

            <button type="submit" class="signup-button" id="signup-button">
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
