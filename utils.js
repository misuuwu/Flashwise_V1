
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
    messageBox.classList.remove('hidden');

    // Hide all action buttons and input container first
    messageBoxOkBtn.classList.add('hidden');
    messageBoxConfirmYesBtn.classList.add('hidden');
    messageBoxConfirmNoBtn.classList.add('hidden');
    messageBoxInputContainer.classList.add('hidden');
    messageBoxInput.value = '';

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
        messageBoxInput.focus();

        // Only show OK button for input dialog
        messageBoxOkBtn.classList.remove('hidden');
        messageBoxOkBtn.onclick = () => {
            const inputValue = messageBoxInput.value.trim();
            messageBox.classList.add('hidden');
            if (onConfirmOrOkCallback) {
                onConfirmOrOkCallback(inputValue);
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
            messageBox.classList.add('hidden');
            if (onConfirmOrOkCallback) {
                onConfirmOrOkCallback();
            }
        };
        // Attach event listener for 'No' button
        messageBoxConfirmNoBtn.onclick = () => {
            messageBox.classList.add('hidden');
        };
        // X button acts like 'No' in a confirm dialog
        messageBoxModalCloseX.onclick = () => {
            messageBox.classList.add('hidden');
        };
    } else {
        // Show only 'OK' button for simple alerts
        messageBoxOkBtn.classList.remove('hidden');
        messageBoxOkBtn.onclick = () => {
            messageBox.classList.add('hidden');
            if (onConfirmOrOkCallback) {
                onConfirmOrOkCallback();
            }
        };
        // X button acts like 'OK' in a simple alert
        messageBoxModalCloseX.onclick = () => {
            messageBox.classList.add('hidden');
        };
    }
}


function triggerShakeAnimation(element) {
    element.classList.add('shake');
    element.addEventListener('animationend', () => {
        element.classList.remove('shake');
    }, { once: true });
}


function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Apply saved theme preference when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
});
