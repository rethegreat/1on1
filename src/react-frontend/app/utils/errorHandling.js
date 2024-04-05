// Add error style to input field
export const addInputErrorStyle = (idString) => {
    const element = document.getElementById(idString);
    element.style.borderBottom = "2px solid #d77474";
    element.style.transition = "border-bottom 0.3s";
};

// Remove error style from input field
export const removeInputErrorStyle = (idString) => {
    const element = document.getElementById(idString);
    element.style.borderBottom = "1px solid #000000";
    element.style.transition = "None";
};