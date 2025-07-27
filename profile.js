
import { auth, db } from './firebase.js';
import { doc, getDoc, collection, query, where, orderBy, getDocs, setDoc, updateDoc, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    const profilePage = document.getElementById('profile-page');

    if (!profilePage) return;

    const profileDisplayUsername = document.getElementById('profile-display-username');
    const profileDisplayId = document.getElementById('profile-display-id');
    const profileDisplayBio = document.getElementById('profile-display-bio');
    const bioDisplayContainer = document.getElementById('bio-display-container');
    const bioEditContainer = document.getElementById('bio-edit-container');
    const profileBioInput = document.getElementById('profile-bio-input');
    const editBioBtn = document.getElementById('edit-bio-btn');
    const saveBioBtn = document.getElementById('save-bio-btn');
    const cancelBioBtn = document.getElementById('cancel-bio-btn');
    const userAvatarLg = document.querySelector('.user-avatar-lg');
    const userInitials = document.getElementById('user-initials');
    // --- Tab Switching ---
    const tabQuizHistory = document.getElementById('tab-quiz-history');
    const tabDecks = document.getElementById('tab-decks');
    const profileContentArea = document.getElementById('profile-content-area');
    const clearHistoryButtonContainer = document.getElementById('clear-history-button-container');

    let currentUserData = null;

    // Helper function to update user profile display
    function updateProfileDisplay(userDoc) {
        if (profileDisplayUsername) profileDisplayUsername.textContent = userDoc.displayName || 'N/A';
        if (profileDisplayId) profileDisplayId.textContent = userDoc.tupId || 'N/A';
        if (profileDisplayBio) profileDisplayBio.textContent = userDoc.bio || 'No bio yet.';
        if (userInitials) userInitials.textContent = userDoc.displayName ? userDoc.displayName.charAt(0).toUpperCase() : (userDoc.email ? userDoc.email.charAt(0).toUpperCase() : '?');
    }

    async function renderSessionHistory(userId) {
        if (!profileContentArea) return;
        profileContentArea.innerHTML = '<p class="text-center text-gray-500">Loading session history...</p>';
        if (clearHistoryButtonContainer) clearHistoryButtonContainer.classList.add('hidden');

        try {
            const historyQuery = query(
                collection(db, "sessionHistory"),
                where("userId", "==", userId),
                orderBy("timestamp", "desc")
            );
            const querySnapshot = await getDocs(historyQuery);

            let historyHtml = '';
            if (querySnapshot.empty) {
                historyHtml = '<p class="text-center text-gray-500">No session history found.</p>';
                if (clearHistoryButtonContainer) clearHistoryButtonContainer.classList.add('hidden'); 
            } else {

                historyHtml = '<div class="flex flex-wrap gap-4 justify-start">';

                querySnapshot.forEach((doc) => {
                    const session = doc.data();
                    const timestamp = session.timestamp ? new Date(session.timestamp.toDate()).toLocaleString() : 'N/A';
                    const scoreDisplay = session.sessionType === 'quiz' && session.score !== null && session.totalQuestions !== null
                        ? `<p class="text-gray-600 text-sm">Score: ${session.score}/${session.totalQuestions}</p>`
                        : '';


                    historyHtml += `
                        <div class="w-[calc((100%-32px)/3)] min-w-[18rem] rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                            <h3 class="truncate font-semibold text-lg">${session.deckName}</h3>
                            <p class="text-sm text-gray-600">Type: ${session.sessionType === 'quiz' ? 'Quiz' : 'Flashcards'}</p>
                            ${scoreDisplay}
                            <p class="mt-2 text-xs text-gray-500">Completed: ${timestamp}</p>
                        </div>
                    `;
                });
                historyHtml += '</div>';
                if (clearHistoryButtonContainer) clearHistoryButtonContainer.classList.remove('hidden');
            }

            profileContentArea.innerHTML = historyHtml;


            const clearHistoryBtn = document.getElementById('clear-history-btn');
            if (clearHistoryBtn) {
                clearHistoryBtn.removeEventListener('click', clearSessionHistory);
                clearHistoryBtn.addEventListener('click', () => clearSessionHistory(userId));
            }

        } catch (error) {
            console.error("Error loading session history:", error);
            profileContentArea.innerHTML = `<p class="text-red-500 text-center">Error loading session history: ${error.message}. Please check your browser's console for more details, and ensure you have the necessary Firestore indexes configured.</p>`;
            if (clearHistoryButtonContainer) clearHistoryButtonContainer.classList.add('hidden');
        }
    }

    // Function to clear session history
    async function clearSessionHistory(userId) {
        if (!confirm("Are you sure you want to clear all your session history? This action cannot be undone.")) {
            return;
        }

        try {
            const historyQuery = query(
                collection(db, "sessionHistory"),
                where("userId", "==", userId)
            );
            const querySnapshot = await getDocs(historyQuery);

            if (querySnapshot.empty) {
                alert("No session history to clear.");
                return;
            }

            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            alert("Session history cleared successfully!");
            renderSessionHistory(userId);
        } catch (error) {
            console.error("Error clearing session history:", error);
            alert("Failed to clear session history: " + error.message);
        }
    }


    // Function to render user's decks
    async function renderUserDecks(userId) {
        if (!profileContentArea) return;
        profileContentArea.innerHTML = '<p class="text-center text-gray-500">Loading your decks...</p>';
        if (clearHistoryButtonContainer) clearHistoryButtonContainer.classList.add('hidden');

        try {
            const q = query(collection(db, "decks"), where("ownerId", "==", userId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                profileContentArea.innerHTML = '<p class="text-center text-gray-500">You haven\'t created any decks yet. Go to the dashboard to create one!</p>';
                return;
            }

            let decksHtml = '<div class="flex flex-wrap gap-4 justify-start">';
            querySnapshot.forEach((doc) => {
                const deck = doc.data();

                const visibility = deck.isShared ? 'Shared' : 'Private';

                decksHtml += `
                    <div class="w-[calc((100%-32px)/3)] min-w-[18rem] p-4 bg-white rounded-lg shadow-md border border-gray-200">
                        <h3 class="font-semibold text-lg truncate">${deck.name}</h3>
                        <p class="text-gray-600 text-sm">Cards: ${deck.cards ? deck.cards.length : 0}</p>
                        <p class="text-gray-600 text-sm">Visibility: ${visibility}</p>
                        <p class="text-gray-500 text-xs mt-2">Created: ${deck.createdAt ? new Date(deck.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                    </div>
                `;
            });
            decksHtml += '</div>';
            profileContentArea.innerHTML = decksHtml;

        } catch (error) {
            console.error("Error loading user decks:", error);
            profileContentArea.innerHTML = `<p class="text-red-500 text-center">Error loading decks: ${error.message}. Please check your browser's console for more details.</p>`;
        }
    }

    // Function to handle tab content rendering
    async function renderProfileContent(userId, activeTab) {
        // Remove active styling from both tabs
        tabQuizHistory?.classList.remove('active-tab', 'border-black', 'text-black');
        tabQuizHistory?.classList.add('text-gray-500', 'border-gray-200');
        tabDecks?.classList.remove('active-tab', 'border-black', 'text-black');
        tabDecks?.classList.add('text-gray-500', 'border-gray-200');

        // Apply active styling and render content for the selected tab
        if (activeTab === 'quiz-history') {
            tabQuizHistory?.classList.add('active-tab', 'border-black', 'text-black');
            tabQuizHistory?.classList.remove('text-gray-500', 'border-gray-200');
            await renderSessionHistory(userId);
        } else if (activeTab === 'decks') {
            tabDecks?.classList.add('active-tab', 'border-black', 'text-black');
            tabDecks?.classList.remove('text-gray-500', 'border-gray-200');
            if (clearHistoryButtonContainer) clearHistoryButtonContainer.classList.add('hidden');
            await renderUserDecks(userId);
        } else {
            profileContentArea.innerHTML = '<p class="text-center text-gray-500">Select a tab to view content.</p>';
            if (clearHistoryButtonContainer) clearHistoryButtonContainer.classList.add('hidden');
        }
    }

    // --- Event Listeners for Profile Page ---
    if (tabQuizHistory) {
        tabQuizHistory.addEventListener('click', () => {
            if (auth.currentUser) {
                renderProfileContent(auth.currentUser.uid, 'quiz-history');
            }
        });
    }

    if (tabDecks) {
        tabDecks.addEventListener('click', () => {
            if (auth.currentUser) {
                renderProfileContent(auth.currentUser.uid, 'decks');
            }
        });
    }

    // Edit Bio functionality
    if (editBioBtn) {
        editBioBtn.addEventListener('click', () => {
            if (bioDisplayContainer) bioDisplayContainer.classList.add('hidden');
            if (bioEditContainer) bioEditContainer.classList.remove('hidden');
            if (profileBioInput && currentUserData) profileBioInput.value = currentUserData.bio || '';
        });
    }

    if (cancelBioBtn) {
        cancelBioBtn.addEventListener('click', () => {
            if (bioDisplayContainer) bioDisplayContainer.classList.remove('hidden');
            if (bioEditContainer) bioEditContainer.classList.add('hidden');
        });
    }

    if (saveBioBtn) {
        saveBioBtn.addEventListener('click', async () => {
            const newBio = profileBioInput?.value.trim();
            const user = auth.currentUser;
            if (!user) {
                console.error("No user logged in to save bio.");
                return;
            }
            try {
                const userDocRef = doc(db, "users", user.uid);
                await updateDoc(userDocRef, { bio: newBio });
                currentUserData.bio = newBio; // Update local state
                if (profileDisplayBio) profileDisplayBio.textContent = newBio || 'No bio yet.';
                if (bioDisplayContainer) bioDisplayContainer.classList.remove('hidden');
                if (bioEditContainer) bioEditContainer.classList.add('hidden');
                console.log("Bio updated successfully!");
            } catch (error) {
                console.error("Error updating bio:", error);
                alert("Failed to update bio: " + error.message);
            }
        });
    }

    // --- Authentication State Observer ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            console.log("Profile page: User is logged in:", user.uid);
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    currentUserData = userDocSnap.data();
                    updateProfileDisplay(currentUserData);
                    renderProfileContent(user.uid, 'quiz-history');
                } else {
                    console.log("Profile page: No user data found in Firestore for UID:", user.uid);
                    currentUserData = { displayName: user.email, tupId: 'N/A', bio: 'No bio yet.' };
                    updateProfileDisplay(currentUserData);
                    renderProfileContent(user.uid, 'quiz-history');
                }
            } catch (error) {
                console.error("Profile page: Error fetching user data:", error);
                currentUserData = { displayName: user.email, tupId: 'N/A', bio: 'No bio yet.' };
                updateProfileDisplay(currentUserData);
                renderProfileContent(user.uid, 'quiz-history');
            }
        } else {
            // User is signed out
            console.log("Profile page: User is logged out.");
            if (window.location.pathname !== '/login.html' && window.location.pathname !== '/signup.html') {
                window.location.href = 'login.html';
            }
        }
    });

    // Initial load of content based on active tab (default to quiz history)
    if (auth.currentUser) {
        renderProfileContent(auth.currentUser.uid, 'quiz-history');
    }
});