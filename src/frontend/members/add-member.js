"use strict";

const Form = document.getElementById("add-member-form");
const submitButton = document.getElementById("plus-button");
const errorMsg = document.getElementById("add-member-error-msg");

submitButton.addEventListener("click", (e) => {
    e.preventDefault();
    const name = Form.name.value;
    const email = Form.email.value;

    // Reset error message and remove red border from input fields
    Form.name.classList.remove('input-error');
    Form.email.classList.remove('input-error'); 

    // Check if both email fields are filled
    if (!name || !email) {
        errorMsg.textContent = "Please fill in all required fields.";
        errorMsg.style.opacity = 1;

        // 2. Add red border to email & password input fields
        Form.name.classList.add('input-error');
        Form.email.classList.add('input-error'); 
        
        return; // Exit the function if any required field is empty
    }

    // Regex for email validation
    const validEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if the email follows a valid email pattern
    if (!validEmailPattern.test(email)) {
        errorMsg.textContent = "Invalid email format."; // Please enter a valid email address.
        errorMsg.style.opacity = 1;

        // 2. Add red border to email input field
        Form.email.classList.add('input-error'); 

        return; // Exit the function if email format is invalid
    }

    if (true /* Check if the email is not already in the database */) {
        alert("Member added successfully!");

        var customValue = submitButton.dataset.customValue;
        window.location.assign(customValue);

    } else {
        /* 
            If the email is ALREADY in the database, display an error message
            and add red border to the email input field
        */

    }
})