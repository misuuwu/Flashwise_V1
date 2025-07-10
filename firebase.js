// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
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
const tupIdInput = document.getElementById('tupId');
const signupEmailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');
const signupPasswordInput = document.getElementById('password');

// Get login form elements
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('loginemail');
const loginPasswordInput = document.getElementById('loginpassword');

// Event listener for signup form submission
if (signupForm) {
    signupForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission

        const tupId = tupIdInput.value;
        const email = signupEmailInput.value;
        const username = usernameInput.value;
        const password = signupPasswordInput.value;

        // Create user with email and password
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                // Store additional user data in Firestore
                return setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    uid: user.uid,
                    displayName: username,
                    tupId: tupId,
                });
            })
            .then(() => {
                console.log("User signed up and data saved to Firestore successfully!");
                alert("Sign up successful! Please log in.");
                window.location.href = "login.html"; // Redirect to login after successful signup
            })
            .catch((error) => {
                const errorMessage = error.message;
                console.error("Signup Error:", error);
                alert("Signup Error: " + errorMessage);
            });
    });
}

// Event listener for login form submission
if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission

        const loginemail = loginEmailInput.value;
        const loginpassword = loginPasswordInput.value;

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
                alert("Login Error: " + errorMessage);
            });
    });
}