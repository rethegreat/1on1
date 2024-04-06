import errorStyles from "../styles/error.module.css";
const inputErrorStyle = `${ errorStyles }.input-error`;

// Add error style to input field
export const addInputErrorStyle = (idString) => {
    const element = document.getElementById(idString);
    element.style.borderBottom = "2px solid #d77474";
    element.style.transition = "border-bottom 0.3s";
};

// Remove error style from input field
export const removeInputErrorStyle = (idString) => {
    const element = document.getElementById(idString);
    element.style.borderBottom = "";
    element.style.transition = "";
};