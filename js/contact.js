// Firebase imports for initialization and logout functionality
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

function showMessageBox(title, message, onOkCallback = null) {
    const messageBox = document.getElementById('messageBox');
    const messageBoxTitle = document.getElementById('messageBoxTitle');
    const messageBoxContent = document.getElementById('messageBoxContent');
    const messageBoxOkBtn = document.getElementById('messageBoxOkBtn');
    const messageBoxModalCloseX = document.getElementById('messageBoxModalCloseX');

    if (!messageBox || !messageBoxTitle || !messageBoxContent || !messageBoxOkBtn || !messageBoxModalCloseX) {
        console.error('One or more message box elements not found. Falling back to alert.');
        alert(`${title}: ${message}`);
        if (onOkCallback) onOkCallback();
        return;
    }

    // Ensure only OK button is visible for simple messages
    document.getElementById('messageBoxInputContainer')?.classList.add('hidden');
    document.getElementById('messageBoxConfirmYesBtn')?.classList.add('hidden');
    document.getElementById('messageBoxConfirmNoBtn')?.classList.add('hidden');
    messageBoxOkBtn.classList.remove('hidden');

    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = message;

    messageBoxOkBtn.onclick = () => {
        messageBox.classList.add('hidden');
        if (onOkCallback) onOkCallback();
    };
    messageBoxModalCloseX.onclick = () => {
        messageBox.classList.add('hidden');
        if (onOkCallback) onOkCallback();
    };

    messageBox.classList.remove('hidden');
}


document.addEventListener('DOMContentLoaded', async () => {
    const firebaseConfig = {
        apiKey: "AIzaSyCK_-UjFxbIgveh7IKhlaJgoIsIdf8qsn4",
        authDomain: "flashwise-803dc.firebaseapp.com",
        projectId: "flashwise-803dc",
        storageBucket: "flashwise-803dc.firebasestorage.app",
        messagingSenderId: "755106781301",
        appId: "1:755106781301:web:cda88445b52b5a47ab403c"
    };

    // --- Firebase Initialization ---
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Initialize EmailJS with your Public Key
    emailjs.init("syM66z6Ba6eu2T2YD");

    const contactForm = document.getElementById('contact-form');
    const nightModeToggle = document.getElementById('night-mode-toggle');
    const logoutButton = document.getElementById('logout-button');
    const emailInput = document.getElementById('email');

    // --- Firebase Auth State Listener to pre-fill email ---
    onAuthStateChanged(auth, (user) => {
        if (user) {

            if (emailInput && !emailInput.value) {
                emailInput.value = user.email || '';
            }
        } else {

            if (emailInput && emailInput.value === auth.currentUser?.email) {
                emailInput.value = '';
            }
        }
    });

    // --- Night Mode Toggle Functionality ---
    if (nightModeToggle) {
        nightModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Apply saved theme on load
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // --- Logout Button Functionality ---

    if (logoutButton && auth) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                console.log("User signed out successfully from contact page.");
                showMessageBox('Logged Out', 'You have been logged out successfully.', () => {
                    window.location.href = "login.html";
                });
            }).catch((error) => {
                console.error("Error signing out:", error);
                showMessageBox('Error', 'Error logging out: ' + error.message);
            });
        });
    } else if (logoutButton) {
        console.error("Firebase Auth object not available for logout button. Is Firebase initialized correctly?");
    }

    // --- EmailJS Form Submission ---
    if (contactForm) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();

            showMessageBox('Sending Message', 'Please wait, your message is being sent...');

            emailjs.sendForm('service_o3h10ew', 'template_3dxswys', this)
                .then(() => {
                    showMessageBox('Success!', 'Your message has been sent successfully. We will get back to you soon!');
                    contactForm.reset();
                })
                .catch((error) => {
                    console.error('Email sending failed:', error);
                    showMessageBox('Error', `Failed to send message. Please try again later. Error: ${error.text || error}`);
                });
        });
    } else {
        console.error('Contact form with ID "contact-form" not found.');
    }
});
