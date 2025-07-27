// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail // <--- NEW: Import sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Export auth and db if they are used in other modules
export { auth, db };

const firebaseConfig = {
    apiKey: "AIzaSyCK_-UjFxbIgveh7IKhlaJgoIsIdf8qsn4",
    authDomain: "flashwise-803dc.firebaseapp.com",
    projectId: "flashwise-803dc",
    storageBucket: "flashwise-803dc.firebasestorage.app",
    messagingSenderId: "755106781301",
    appId: "1:755106781301:web:cda88445b52b5a47ab403c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get signup form elements
const signupForm = document.getElementById('signup-form');
const signupEmailInput = document.getElementById('email');
const signupUsernameInput = document.getElementById('username');
const signupPasswordInput = document.getElementById('password');

// Get login form elements
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('loginemail');
const loginPasswordInput = document.getElementById('loginpassword');

// <--- NEW: Get forgot password form element
const forgotPasswordForm = document.getElementById('forgot-password-form');
const resetEmailInput = document.getElementById('resetEmail'); // Assuming input ID is 'resetEmail'

const loadingOverlay = document.getElementById('loadingOverlay');

function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// Ensure showMessageBox and triggerShakeAnimation are globally available or imported if needed
// If these are in utils.js, ensure utils.js is loaded before this script or its functions are exported.
// For example, if they are in utils.js and utils.js is a module, you'd do:
// import { showMessageBox, triggerShakeAnimation } from './utils.js';

// Assuming showMessageBox is globally accessible (e.g., defined in utils.js and loaded via <script src="utils.js"></script>)
// If not, you'll need to define it here or import it.
function showMessageBox(title, content, type = 'alert') {
    const messageBox = document.getElementById('messageBox');
    const messageBoxTitle = document.getElementById('messageBoxTitle');
    const messageBoxContent = document.getElementById('messageBoxContent');
    const messageBoxOkBtn = document.getElementById('messageBoxOkBtn');
    const messageBoxConfirmYesBtn = document.getElementById('messageBoxConfirmYesBtn');
    const messageBoxConfirmNoBtn = document.getElementById('messageBoxConfirmNoBtn');
    const messageBoxInputContainer = document.getElementById('messageBoxInputContainer'); // Ensure this exists

    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = content;

    // Reset visibility of action buttons and input container
    messageBoxOkBtn.classList.add('hidden');
    messageBoxConfirmYesBtn.classList.add('hidden');
    messageBoxConfirmNoBtn.classList.add('hidden');
    if (messageBoxInputContainer) { // Check if it exists before trying to modify
        messageBoxInputContainer.classList.add('hidden');
    }

    if (type === 'confirm') {
        messageBoxConfirmYesBtn.classList.remove('hidden');
        messageBoxConfirmNoBtn.classList.remove('hidden');
    } else {
        messageBoxOkBtn.classList.remove('hidden');
    }

    messageBox.classList.remove('hidden');

    return new Promise((resolve) => {
        const handleOk = () => {
            messageBox.classList.add('hidden');
            messageBoxOkBtn.removeEventListener('click', handleOk);
            resolve(true);
        };
        const handleYes = () => {
            messageBox.classList.add('hidden');
            messageBoxConfirmYesBtn.removeEventListener('click', handleYes);
            messageBoxConfirmNoBtn.removeEventListener('click', handleNo);
            resolve(true);
        };
        const handleNo = () => {
            messageBox.classList.add('hidden');
            messageBoxConfirmYesBtn.removeEventListener('click', handleYes);
            messageBoxConfirmNoBtn.removeEventListener('click', handleNo);
            resolve(false);
        };
        const handleCloseX = () => {
             messageBox.classList.add('hidden');
             messageBoxOkBtn.removeEventListener('click', handleOk);
             messageBoxConfirmYesBtn.removeEventListener('click', handleYes);
             messageBoxConfirmNoBtn.removeEventListener('click', handleNo);
             resolve(false);
        };

        if (type === 'confirm') {
            messageBoxConfirmYesBtn.addEventListener('click', handleYes, { once: true });
            messageBoxConfirmNoBtn.addEventListener('click', handleNo, { once: true });
        } else {
            messageBoxOkBtn.addEventListener('click', handleOk, { once: true });
        }

        const closeBtn = document.getElementById('messageBoxModalCloseX');
        if (closeBtn) {
            closeBtn.addEventListener('click', handleCloseX, { once: true });
        }
    });
}

// Assuming triggerShakeAnimation is globally accessible or imported.
// If not, you'd define it here or import it.
function triggerShakeAnimation(element) {
    if (element) {
        element.classList.add('shake-animation');
        element.addEventListener('animationend', () => {
            element.classList.remove('shake-animation');
        }, { once: true });
    }
}
// You would also need to add 'shake-animation' CSS in your styles.css
/*
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
.shake-animation {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
    perspective: 1000px;
}
*/


// Event listener for signup form submission
if (signupForm) {
    signupForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const email = signupEmailInput.value;
        const username = signupUsernameInput.value;
        const password = signupPasswordInput.value;

        if (!email || !username || !password) {
            showMessageBox('Error', 'Email, username, and password are required for signup.');
            triggerShakeAnimation(signupForm);
            return;
        }

        showLoading();

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed up
                const user = userCredential.user;
                console.log("User signed up:", user);

                return updateProfile(user, { displayName: username });
            })
            .then(() => {
                showMessageBox('Signup Success', 'Account created successfully! Redirecting to login...', 'alert');
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500); // Redirect after message is seen
            })
            .catch((error) => {
                const errorMessage = error.message;
                console.error("Signup Error:", error);
                showMessageBox('Signup Error', 'Failed to sign up: ' + errorMessage);
                triggerShakeAnimation(signupForm);
            })
            .finally(() => {
                hideLoading();
            });
    });
}

// Event listener for login form submission
if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const loginemail = loginEmailInput.value;
        const loginpassword = loginPasswordInput.value;

        if (!loginemail || !loginpassword) {
            showMessageBox('Error', 'Email and password are required for login.');
            triggerShakeAnimation(loginForm);
            return;
        }

        showLoading();

        signInWithEmailAndPassword(auth, loginemail, loginpassword)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;
                console.log("User logged in:", user);
                showMessageBox('Login Success', 'Logged in successfully! Redirecting...', 'alert');
                setTimeout(() => {
                    window.location.href = "index.html"; // Redirect to your main app page
                }, 1500);
            })
            .catch((error) => {
                const errorMessage = error.message;
                console.error("Login Error:", error);
                showMessageBox('Login Error', 'Failed to log in: ' + errorMessage);
                triggerShakeAnimation(loginForm);
            })
            .finally(() => {
                hideLoading();
            });
    });
}

// <--- NEW: Event listener for forgot password form submission
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = resetEmailInput.value; // Get email from the specific input on this form

        if (!email) {
            showMessageBox('Error', 'Please enter your email address to reset your password.');
            triggerShakeAnimation(forgotPasswordForm);
            return;
        }

        showLoading();
        try {
            await sendPasswordResetEmail(auth, email);
            showMessageBox('Password Reset Sent', 'If an account with that email exists, a password reset link has been sent to your email address. Please check your inbox (and spam folder).', 'alert');
            // Optionally clear the input field after sending
            resetEmailInput.value = '';
        } catch (error) {
            console.error("Password reset error:", error.message);
            // It's good practice not to reveal whether an email exists for security reasons
            showMessageBox('Password Reset Failed', 'An error occurred while sending the reset link. Please try again later.', 'error');
        } finally {
            hideLoading();
        }
    });
}
