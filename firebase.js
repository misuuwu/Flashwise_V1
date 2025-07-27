// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"; // Added updateProfile
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
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
                window.location.href = "login.html";
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
                window.location.href = "index.html";
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