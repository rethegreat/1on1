"use strict";

const loginForm = document.getElementById("signup-form");
const loginButton = document.getElementById("signup-button");
const loginErrorMsg = document.getElementById("login-error-msg");

loginButton.addEventListener("click", (e) => {
    e.preventDefault();
    const name = loginForm.name.value;
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    // Reset error message and remove red border from input fields
    loginForm.name.classList.remove('input-error'); 
    loginForm.email.classList.remove('input-error'); 
    loginForm.password.classList.remove('input-error');

    // Check if both email and password fields are filled
    if (!name || !email || !password) {
        loginErrorMsg.textContent = "Please fill in all required fields.";
        loginErrorMsg.style.opacity = 1;

        // 2. Add red border to email & password input fields
        loginForm.name.classList.add('input-error'); 
        loginForm.email.classList.add('input-error'); 
        loginForm.password.classList.add('input-error');

        return; // Exit the function if any required field is empty
    }

    // Regex for email validation
    const validEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if the email follows a valid email pattern
    if (!validEmailPattern.test(email)) {
        loginErrorMsg.textContent = "Invalid email format. Please enter a valid email address.";
        loginErrorMsg.style.opacity = 1;

        // 2. Add red border to email input field
        loginForm.email.classList.add('input-error'); 

        return; // Exit the function if email format is invalid
    }

    alert("Welcome! You have successfully signed up.");
    window.location.assign('../home-personal/home-empty.html');
})