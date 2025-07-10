/**
 * Displays a custom message box as an alert, confirmation dialog, or input dialog.
 * @param {string} title - The title of the message box.
 * @param {string} message - The content message to display.
 * @param {Function} [onConfirmOrOkCallback=null] - Callback for OK/Yes. For input, this receives the input value.
 * @param {boolean} [isConfirm=false] - If true, displays 'Yes'/'No' buttons.
 * @param {string} [inputType=null] - If 'text' or 'number', displays an input field.
 * @param {string} [inputPlaceholder=''] - Placeholder for the input field.
 * @param {string} [inputLabel=''] - Label for the input field.
 */
function showMessageBox(title, message, onConfirmOrOkCallback = null, isConfirm = false, inputType = null, inputPlaceholder = '', inputLabel = '') {
    const messageBox = document.getElementById('messageBox');
    const messageBoxTitle = document.getElementById('messageBoxTitle');
    const messageBoxContent = document.getElementById('messageBoxContent');
    const messageBoxOkBtn = document.getElementById('messageBoxOkBtn');
    const messageBoxConfirmYesBtn = document.getElementById('messageBoxConfirmYesBtn');
    const messageBoxConfirmNoBtn = document.getElementById('messageBoxConfirmNoBtn');
    const messageBoxModalCloseX = document.getElementById('messageBoxModalCloseX');
    const messageBoxInputContainer = document.getElementById('messageBoxInputContainer');
    const messageBoxInputLabel = document.getElementById('messageBoxInputLabel');
    const messageBoxInput = document.getElementById('messageBoxInput');

    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = message;
    messageBox.classList.remove('hidden'); // Show the modal overlay

    // Hide all action buttons and input container first
    messageBoxOkBtn.classList.add('hidden');
    messageBoxConfirmYesBtn.classList.add('hidden');
    messageBoxConfirmNoBtn.classList.add('hidden');
    messageBoxInputContainer.classList.add('hidden');
    messageBoxInput.value = ''; // Clear previous input value

    // Remove previous event listeners to prevent multiple triggers
    messageBoxOkBtn.onclick = null;
    messageBoxConfirmYesBtn.onclick = null;
    messageBoxConfirmNoBtn.onclick = null;
    messageBoxModalCloseX.onclick = null;

    if (inputType) {
        // Configure and show input field
        messageBoxInputContainer.classList.remove('hidden');
        messageBoxInputLabel.textContent = inputLabel;
        messageBoxInput.placeholder = inputPlaceholder;
        messageBoxInput.type = inputType;
        messageBoxInput.focus(); // Focus the input field

        // Only show OK button for input dialog
        messageBoxOkBtn.classList.remove('hidden');
        messageBoxOkBtn.onclick = () => {
            const inputValue = messageBoxInput.value.trim();
            messageBox.classList.add('hidden'); // Hide the modal
            if (onConfirmOrOkCallback) {
                onConfirmOrOkCallback(inputValue); // Pass input value to callback
            }
        };
        messageBoxModalCloseX.onclick = () => {
            messageBox.classList.add('hidden');
        };

    } else if (isConfirm) {
        // Show Yes/No buttons for confirmation
        messageBoxConfirmYesBtn.classList.remove('hidden');
        messageBoxConfirmNoBtn.classList.remove('hidden');

        // Attach event listener for 'Yes' button
        messageBoxConfirmYesBtn.onclick = () => {
            messageBox.classList.add('hidden'); // Hide the modal
            if (onConfirmOrOkCallback) {
                onConfirmOrOkCallback(); // Execute callback if provided
            }
        };
        // Attach event listener for 'No' button
        messageBoxConfirmNoBtn.onclick = () => {
            messageBox.classList.add('hidden'); // Hide the modal
        };
        // X button acts like 'No' in a confirm dialog
        messageBoxModalCloseX.onclick = () => {
            messageBox.classList.add('hidden');
        };
    } else {
        // Show only 'OK' button for simple alerts
        messageBoxOkBtn.classList.remove('hidden');
        messageBoxOkBtn.onclick = () => {
            messageBox.classList.add('hidden'); // Hide the modal
            if (onConfirmOrOkCallback) {
                onConfirmOrOkCallback(); // Execute callback if provided
            }
        };
        // X button acts like 'OK' in a simple alert
        messageBoxModalCloseX.onclick = () => {
            messageBox.classList.add('hidden');
        };
    }
}

/**
 * Triggers a shake animation on a given HTML element.
 * @param {HTMLElement} element - The element to apply the shake animation to.
 */
function triggerShakeAnimation(element) {
    element.classList.add('shake');
    // Remove the shake class after the animation completes
    element.addEventListener('animationend', () => {
        element.classList.remove('shake');
    }, { once: true }); // Use { once: true } to automatically remove the listener after it fires
}

/**
 * Basic email format validation using a regular expression.
 * @param {string} email - The email string to validate.
 * @returns {boolean} True if the email format is valid, false otherwise.
 */
function isValidEmail(email) {
    // A simple regex for email validation (can be more robust if needed)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Apply saved theme preference when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
});
