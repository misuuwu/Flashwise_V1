// Firebase imports for initialization and logout functionality
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Function to display messages (a simplified version of your showMessageBox from app.js)
// This function assumes the messageBox HTML structure from index.html is present in contact.html
function showMessageBox(title, message, onOkCallback = null) {
    const messageBox = document.getElementById('messageBox');
    const messageBoxTitle = document.getElementById('messageBoxTitle');
    const messageBoxContent = document.getElementById('messageBoxContent');
    const messageBoxOkBtn = document.getElementById('messageBoxOkBtn');
    const messageBoxModalCloseX = document.getElementById('messageBoxModalCloseX');

    // Fallback to native alert if custom message box elements are not found
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
    // --- Firebase Configuration (copied directly from your firebase.js) ---
    const firebaseConfig = {
        apiKey: "AIzaSyCK_-UjFxbIgveh7IKhlaJgoIsIdf8qsn4",
        authDomain: "flashwise-803dc.firebaseapp.com",
        projectId: "flashwise-803dc",
        storageBucket: "flashwise-803dc.firebasestorage.app",
        messagingSenderId: "755106781301",
        appId: "1:755106781301:web:cda88445b52b5a47ab403c"
    };

    // --- Firebase Initialization ---
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    // Get the Auth instance
    const auth = getAuth(app);

    // Initialize EmailJS with your Public Key
    emailjs.init("syM66z6Ba6eu2T2YD"); // Updated with your Public Key

    const contactForm = document.getElementById('contact-form');
    const nightModeToggle = document.getElementById('night-mode-toggle');
    const logoutButton = document.getElementById('logout-button'); // Get reference to the logout button
    const emailInput = document.getElementById('email'); // Get reference to the email input field

    // --- Firebase Auth State Listener to pre-fill email ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, pre-fill email if the field exists and is empty
            if (emailInput && !emailInput.value) {
                emailInput.value = user.email || '';
            }
        } else {
            // User is signed out, clear email field if it was pre-filled by auth
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
    // Ensure auth is available before trying to sign out
    if (logoutButton && auth) { // Check if auth object is defined
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                console.log("User signed out successfully from contact page.");
                showMessageBox('Logged Out', 'You have been logged out successfully.', () => {
                    // Redirect to login page after successful logout
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
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission

            // Show a loading message
            showMessageBox('Sending Message', 'Please wait, your message is being sent...');

            // Send the email using EmailJS
            emailjs.sendForm('service_o3h10ew', 'template_3dxswys', this) // Updated with new template ID
                .then(() => {
                    showMessageBox('Success!', 'Your message has been sent successfully. We will get back to you soon!');
                    contactForm.reset(); // Clear the form
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
