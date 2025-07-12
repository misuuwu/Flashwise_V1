
// Firebase imports
import { auth, db } from './firebase.js'; // Import auth and db from firebase.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, addDoc, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// Global variables for page elements (ensure these IDs exist in index.html)
const dashboardPage = document.getElementById('dashboard-page');
const quizPage = document.getElementById('quiz-page');
const deckManagementPage = document.getElementById('deck-management-page');

// Link/Button elements for navigation and actions
const logoutButton = document.getElementById('logout-button');
const nightModeToggle = document.getElementById('night-mode-toggle');

// Dashboard specific elements
const userDisplayNameElement = document.getElementById('user-display-name'); // Corrected ID
const userAvatarElement = document.querySelector('.user-avatar');
const myDecksContainer = document.getElementById('my-decks-container');
const sharedDecksContainer = document.getElementById('shared-decks-container');
const createDeckBtn = document.getElementById('create-deck-btn');
const importDeckBtn = document.getElementById('import-deck-btn');

// Deck Management specific elements
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
const currentDeckNameDisplay = document.getElementById('current-deck-name');
const deckCardCountDisplay = document.getElementById('deck-card-count');
const deckDefaultTimerDisplay = document.getElementById('deck-default-timer');
const addNewCardBtn = document.getElementById('add-new-card-btn');
const currentDeckCardsList = document.getElementById('current-deck-cards-list');
const modeFlashcardsRadio = document.getElementById('mode-flashcards');
const modeQuizRadio = document.getElementById('mode-quiz');
const sessionQuizTimerInput = document.getElementById('session-quiz-timer');
const startModeBtn = document.getElementById('start-mode-btn');

// Quiz specific elements
const quizTimerDisplay = document.getElementById('quiz-timer');
const quizScoreDisplay = document.getElementById('quiz-score');
const quizCardWrapper = document.getElementById('quiz-card-wrapper');
const quizCard = document.getElementById('quiz-card');
const quizQuestion = document.getElementById('quiz-question');
const quizAnswer = document.getElementById('quiz-answer');
const quizImageFront = document.getElementById('quiz-image-front');
const quizImageBack = document.getElementById('quiz-image-back');
const prevCardBtn = document.getElementById('prev-card-btn');
const nextCardBtn = document.getElementById('next-card-btn');
const finishQuizBtn = document.getElementById('finish-quiz-btn');
const quizChoiceButtons = document.getElementById('quiz-choice-buttons');
const quizFeedbackDisplay = document.getElementById('quiz-feedback');

// Global quiz state variables
let currentQuizSet = []; 
let currentCardIndex = 0;
let quizTimerInterval;
let quizTimeRemaining;
let quizMode = 'flashcards'; 
let correctAnswersCount = 0; 
let totalQuestionsAnswered = 0; 

// Modal elements
const createDeckModal = document.getElementById('createDeckModal');
const createDeckForm = document.getElementById('create-deck-form');
const newDeckNameInput = document.getElementById('new-deck-name');
const newDeckTimerInput = document.getElementById('new-deck-timer');

const createCardModal = document.getElementById('createCardModal');
const createCardModalTitle = document.getElementById('createCardModalTitle');
const createCardForm = document.getElementById('create-card-form');
const cardQuestionInput = document.getElementById('card-question');
const cardAnswerInput = document.getElementById('card-answer');
const cardImageURLInput = document.getElementById('card-image-url');
const cardImagePreview = document.getElementById('card-image-preview');
const deleteCardBtn = document.getElementById('delete-card-btn');

const shareDeckModal = document.getElementById('shareDeckModal');
const shareDeckLinkInput = document.getElementById('share-deck-link');
const copyShareLinkBtn = document.getElementById('copy-share-link-btn');

// State for which deck/card is currently being edited/viewed (Firestore IDs)
let currentManagingDeckId = null; 
let currentEditingCardIndex = null; 

// Stores the current user's Firestore data (displayName, tupId)
let currentUserFirestoreData = null;

// Predefined list of random words for distractors in quiz mode
const randomWords = [
    "apple", "banana", "cat", "dog", "house", "tree", "river", "mountain", "cloud", "sun",
    "moon", "star", "car", "bike", "book", "pen", "table", "chair", "water", "fire",
    "bird", "fish", "flower", "grass", "stone", "metal", "wood", "glass", "paper", "cloth",
    "music", "dance", "sport", "game", "smile", "laugh", "cry", "sleep", "dream", "walk",
    "run", "jump", "sing", "talk", "listen", "read", "write", "think", "learn", "teach"
];


// --- Global Page Visibility & Routing (Crucial for Firebase Auth) ---

function hideAllAppPages() {
    dashboardPage?.classList.add('hidden');
    quizPage?.classList.add('hidden');
    deckManagementPage?.classList.add('hidden');
    createDeckModal?.classList.add('hidden');
    createCardModal?.classList.add('hidden');
    shareDeckModal?.classList.add('hidden');
}


function showAppPage(pageElement) {
    hideAllAppPages();
    pageElement?.classList.remove('hidden');
}

// Flag to ensure event listeners are only attached once
let hasInitializedDashboardListeners = false;


function initDashboardListeners() {
    if (hasInitializedDashboardListeners) return; // Prevent re-initialization

    // --- Logout Button Listener ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                console.log("User signed out successfully.");
                showMessageBox('Logged Out', 'You have been logged out successfully.');
            }).catch((error) => {
                console.error("Error signing out:", error);
                showMessageBox('Error', 'Error logging out: ' + error.message);
            });
        });
    }

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

    // --- Create/Edit Deck Modal Logic ---
    if (createDeckBtn) {
        createDeckBtn.addEventListener('click', () => {
            if (!auth.currentUser) {
                showMessageBox('Error', 'Please log in to create decks.');
                return;
            }
            document.getElementById('createDeckModalTitle').textContent = 'Create New Deck';
            newDeckNameInput.value = '';
            newDeckTimerInput.value = '60'; 
            createDeckModal.classList.remove('hidden');
            currentManagingDeckId = null; 
        });
    }

   
    if (createDeckForm) {
        createDeckForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const deckName = newDeckNameInput.value.trim();
            const defaultTimer = parseInt(newDeckTimerInput.value, 10);
            const createDeckModalContent = createDeckModal.querySelector('.modal-content');
            const currentUser = auth.currentUser;

            if (!currentUser) {
                showMessageBox('Error', 'You must be logged in to create/edit decks.');
                return;
            }

            if (!deckName) {
                showMessageBox('Error', 'Deck name cannot be empty.');
                triggerShakeAnimation(createDeckModalContent);
                return;
            }
            if (isNaN(defaultTimer) || defaultTimer < 10) {
                showMessageBox('Error', 'Please enter a valid quiz timer (minimum 10 seconds).');
                triggerShakeAnimation(createDeckModalContent);
                return;
            }

            try {
                if (currentManagingDeckId) {
                    // Update existing deck
                    const deckRef = doc(db, "decks", currentManagingDeckId);
                    await updateDoc(deckRef, {
                        name: deckName,
                        defaultTimer: defaultTimer
                    });
                    showMessageBox('Deck Updated', `Deck "${deckName}" updated successfully.`);
                } else {
                    // Create new deck
                    await addDoc(collection(db, "decks"), {
                        name: deckName,
                        defaultTimer: defaultTimer,
                        ownerId: currentUser.uid,
                        ownerDisplayName: currentUserFirestoreData?.displayName || currentUser.email,
                        cards: [] 
                    });
                    showMessageBox('New Deck Created', `Deck "${deckName}" created successfully.`);
                }
                createDeckModal.classList.add('hidden'); // Hide the modal
                renderFlashcardSets(); 
            } catch (error) {
                console.error("Error saving deck:", error);
                showMessageBox('Error', 'Failed to save deck: ' + error.message);
                triggerShakeAnimation(createDeckModalContent);
            }
        });
    }

    // Event listener to go back to the dashboard from the deck management page
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            showAppPage(dashboardPage);
        });
    }

    // Event listener to open the 'add new card' modal from the deck management page
    if (addNewCardBtn) {
        addNewCardBtn.addEventListener('click', () => {
            // currentManagingDeckId should already be set when entering deck management page
            if (currentManagingDeckId) {
                openCreateCardModal(null, currentManagingDeckId);
            } else {
                showMessageBox('Error', 'Please select a deck first.');
            }
        });
    }

    // Event listener to start the selected mode (Flashcards or Quiz)
    if (startModeBtn) {
        startModeBtn.addEventListener('click', async () => {
            if (!auth.currentUser || !currentManagingDeckId) {
                showMessageBox('Error', 'Please log in and select a deck to start a mode.');
                return;
            }

            quizMode = document.querySelector('input[name="quiz-mode"]:checked')?.value || 'flashcards'; 
            let sessionTimer = 0;

            if (quizMode === 'quiz') {
                sessionTimer = parseInt(sessionQuizTimerInput.value, 10);
                if (isNaN(sessionTimer) || sessionTimer < 10) {
                    showMessageBox('Error', 'Please enter a valid quiz timer (minimum 10 seconds).');
                    return;
                }
            }

            try {
                const deckDoc = await getDoc(doc(db, "decks", currentManagingDeckId));
                if (!deckDoc.exists()) {
                    showMessageBox('Error', 'Deck not found.');
                    return;
                }
                const deck = deckDoc.data();
                if (!deck.cards || deck.cards.length === 0) {
                    showMessageBox('No Cards', 'This deck has no cards to start a mode.');
                    return;
                }

                // Create a copy of cards for the quiz session, adding 'answered' and 'correct' properties
                const quizCardsForSession = deck.cards.map(card => ({ ...card, answered: false, correct: false }));

                startQuiz(quizCardsForSession, sessionTimer, quizMode);
            } catch (error) {
                console.error("Error starting quiz:", error);
                showMessageBox('Error', 'Failed to start quiz: ' + error.message);
            }
        });
    }

    // Event listeners to toggle visibility of timer input based on selected mode
    if (modeFlashcardsRadio) {
        modeFlashcardsRadio.addEventListener('change', () => {
            document.getElementById('mode-timer-setting')?.classList.add('hidden');
        });
    }

    if (modeQuizRadio) {
        modeQuizRadio.addEventListener('change', () => {
            document.getElementById('mode-timer-setting')?.classList.remove('hidden');
        });
    }

    /**
     * Updates the image preview when a URL is entered into the image URL input.
     */
    if (cardImageURLInput) {
        cardImageURLInput.addEventListener('input', () => {
            const url = cardImageURLInput.value.trim();
            if (url && cardImagePreview) {
                const img = document.createElement('img');
                img.src = url;
                img.onerror = () => {
                    img.src = "https://placehold.co/150x100/CCCCCC/000000?text=Invalid+Image";
                    img.alt = "Invalid Image";
                };
                cardImagePreview.innerHTML = '';
                cardImagePreview.appendChild(img);
            } else if (cardImagePreview) {
                cardImagePreview.innerHTML = '<span class="placeholder-icon">📷</span>'; 
            }
        });
    }

    if (createCardForm) {
        createCardForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const question = cardQuestionInput.value.trim();
            const answer = cardAnswerInput.value.trim();
            const imageUrl = cardImageURLInput.value.trim();
            const createCardModalContent = createCardModal.querySelector('.modal-content');
            const currentUser = auth.currentUser;

            if (!currentUser) {
                showMessageBox('Error', 'You must be logged in to save cards.');
                return;
            }

            if (!question || !answer) {
                showMessageBox('Error', 'Question and Answer fields cannot be empty.');
                triggerShakeAnimation(createCardModalContent);
                return;
            }

            if (!currentManagingDeckId) {
                showMessageBox('Error', 'No deck selected to add/edit card to.');
                return;
            }

            try {
                const deckRef = doc(db, "decks", currentManagingDeckId);
                const deckDoc = await getDoc(deckRef);

                if (!deckDoc.exists() || deckDoc.data().ownerId !== currentUser.uid) {
                    showMessageBox('Error', 'Deck not found or you do not have permission to modify it.');
                    return;
                }

                const currentCards = deckDoc.data().cards || [];
                const newCard = { question, answer, imageUrl: imageUrl || undefined }; 

                let updatedCards = [...currentCards]; // Create a mutable copy

                if (currentEditingCardIndex !== null) {
                    // Update existing card
                    updatedCards[currentEditingCardIndex] = newCard;
                    showMessageBox('Card Updated', 'Card updated successfully.');
                } else {
                    // Add new card to the current deck
                    updatedCards.push(newCard);
                    showMessageBox('Card Added', 'New card added successfully.');
                }

                await updateDoc(deckRef, { cards: updatedCards }); // Update Firestore with the new cards array
                createCardModal.classList.add('hidden'); // Hide modal
                renderCardsInDeckManagement(currentManagingDeckId, updatedCards); // Re-render cards list in deck management view
            } catch (error) {
                console.error("Error saving card:", error);
                showMessageBox('Error', 'Failed to save card: ' + error.message);
                triggerShakeAnimation(createCardModalContent);
            }
        });
    }

    /**
     * Handles deletion of a card from the current deck.
     */
    if (deleteCardBtn) {
        deleteCardBtn.addEventListener('click', async () => {
            if (currentManagingDeckId && currentEditingCardIndex !== null) {
                try {
                    const deckRef = doc(db, "decks", currentManagingDeckId);
                    const deckDoc = await getDoc(deckRef);
                    if (!deckDoc.exists() || deckDoc.data().ownerId !== auth.currentUser.uid) {
                        showMessageBox('Error', 'Deck not found or permission denied.');
                        return;
                    }
                    const currentCards = deckDoc.data().cards || [];
                    deleteCardFromDeck(currentManagingDeckId, currentEditingCardIndex, currentCards);
                    createCardModal.classList.add('hidden'); // Close modal after deletion
                } catch (error) {
                    console.error("Error preparing to delete card:", error);
                    showMessageBox('Error', 'Failed to delete card: ' + error.message);
                }
            }
        });
    }

    /**
     * Copies the shareable link to the clipboard.
     */
    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            if (shareDeckLinkInput) {
                shareDeckLinkInput.select();
                shareDeckLinkInput.setSelectionRange(0, 99999); // For mobile devices
                try {
                    document.execCommand('copy'); // Fallback for navigator.clipboard
                    showMessageBox('Copied!', 'Share link copied to clipboard!');
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    showMessageBox('Error', 'Could not copy link. Please copy it manually.');
                }
            }
        });
    }

    /**
     * Prompts user for a share ID and imports the corresponding deck.
     */
    if (importDeckBtn) {
        importDeckBtn.addEventListener('click', () => {
            if (!auth.currentUser) {
                showMessageBox('Error', 'Please log in to import decks.');
                return;
            }
            showMessageBox(
                'Import Deck',
                'Please enter the Share ID of the deck you want to import:',
                (shareId) => { // Callback receives the input value
                    if (shareId) {
                        importDeck(shareId);
                    }
                },
                false, // Not a confirmation
                'text', // Input type
                'Enter Share ID here', // Input placeholder
                'Share ID:' // Input label
            );
        });
    }

 
    if (quizCard) {
        quizCard.addEventListener('click', () => {
            const card = currentQuizSet[currentCardIndex];

            if (quizMode === 'quiz' && card.answered) {
                // If already answered in quiz mode, just toggle flip, no new choices/feedback for action
                quizCard.classList.toggle('flipped');
                if (quizCard.classList.contains('flipped')) {
                    // If flipped to answer side, show image/answer if any
                    if (card.imageUrl && quizImageBack) {
                        quizImageBack.src = card.imageUrl;
                        quizImageBack.classList.remove('hidden');
                        quizImageBack.onerror = () => { /* error handling */ };
                    }
                    if (quizAnswer) quizAnswer.textContent = card.answer;
                    // Re-display feedback for already answered card
                    if (quizFeedbackDisplay) {
                        quizFeedbackDisplay.classList.remove('hidden');
                        quizFeedbackDisplay.textContent = card.correct ? 'Correct!' : 'Incorrect!';
                        quizFeedbackDisplay.classList.toggle('feedback-correct', card.correct);
                        quizFeedbackDisplay.classList.toggle('feedback-incorrect', !card.correct);
                    }
                } else {
                    // Flipped back to question side, hide answer image/feedback
                    if (quizImageBack) quizImageBack.classList.add('hidden');
                    if (quizFeedbackDisplay) quizFeedbackDisplay.classList.add('hidden');
                }
                return;
            }

            quizCard.classList.toggle('flipped');

            if (quizCard.classList.contains('flipped')) {
                // Card is now flipped to the answer side
                if (card.imageUrl && quizImageBack) {
                    quizImageBack.src = card.imageUrl;
                    quizImageBack.classList.remove('hidden');
                    quizImageBack.onerror = () => {
                        quizImageBack.src = "https://placehold.co/150x100/CCCCCC/000000?text=Image+Error";
                        img.alt = "Image Error";
                    };
                }
                if (quizAnswer) quizAnswer.textContent = card.answer;

                if (quizMode === 'quiz' && quizChoiceButtons) {
                    // Generate and display multiple choices
                    quizChoiceButtons.classList.remove('hidden');
                    quizChoiceButtons.innerHTML = ''; // Clear previous buttons

                    const choices = generateChoices(card.answer, currentQuizSet, 3); // 3 distractors

                    choices.forEach(choiceText => {
                        const choiceBtn = document.createElement('button');
                        choiceBtn.textContent = choiceText;
                        choiceBtn.classList.add('btn-primary', 'py-3', 'text-base'); // Apply button styles
                        choiceBtn.onclick = () => recordAnswer(choiceText === card.answer, choiceText);
                        quizChoiceButtons.appendChild(choiceBtn);
                    });
                }
            } else {
                // Card is now flipped back to the question side
                if (quizChoiceButtons) quizChoiceButtons.classList.add('hidden'); // Hide choice buttons
                if (quizFeedbackDisplay) quizFeedbackDisplay.classList.add('hidden'); // Hide feedback
            }
        });
    }


    if (prevCardBtn) {
        prevCardBtn.addEventListener('click', () => {
            if (currentCardIndex > 0) {
                currentCardIndex--;
                renderQuizCard();
            } else {
                showMessageBox('Start', 'You are at the first card. Cannot go back further.');
            }
        });
    }


    if (nextCardBtn) {
        nextCardBtn.addEventListener('click', () => {
            if (currentCardIndex < currentQuizSet.length - 1) {
                currentCardIndex++;
                renderQuizCard();
            } else {
                showMessageBox('End', 'You are at the last card. Click "Finish Quiz" when done.');
            }
        });
    }


    if (finishQuizBtn) {
        finishQuizBtn.addEventListener('click', () => {
            finishQuiz('manual'); // User clicked finish button
        });
    }

    hasInitializedDashboardListeners = true; // Set flag to true after initialization
}



onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        console.log("User is logged in:", user.uid);

        // Fetch user data from Firestore to get displayName and tupId
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                currentUserFirestoreData = userDocSnap.data();
                const displayName = currentUserFirestoreData.displayName || user.email;
                const tupId = currentUserFirestoreData.tupId || 'N/A';

                if (userDisplayNameElement) {
                    userDisplayNameElement.textContent = `${displayName} #${tupId}`;
                }
                if (userAvatarElement) {
                    userAvatarElement.textContent = displayName.charAt(0).toUpperCase();
                }
            } else {
                console.log("No user data found in Firestore for UID:", user.uid);
                if (userDisplayNameElement) {
                    userDisplayNameElement.textContent = `${user.email}`;
                }
                if (userAvatarElement) {
                    userAvatarElement.textContent = user.email.charAt(0).toUpperCase();
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            if (userDisplayNameElement) {
                userDisplayNameElement.textContent = `${user.email}`;
            }
            if (userAvatarElement) {
                userAvatarElement.textContent = user.email.charAt(0).toUpperCase();
            }
        }

        // Initialize dashboard listeners only once after user is authenticated
        initDashboardListeners();

        // Show dashboard page
        showAppPage(dashboardPage);
        // Load decks only after user data is available
        await renderFlashcardSets(); // Fetch and render personal decks
        await renderSharedFlashcardSets(); // Fetch and render shared decks

        // Handle potential deep linking for shared decks
        const urlParams = new URLSearchParams(window.location.search);
        const shareDeckIdParam = urlParams.get('shareDeckId');
        if (shareDeckIdParam) {
            showMessageBox(
                'Import Shared Deck',
                `Do you want to import the shared deck with ID: ${shareDeckIdParam}?`,
                () => {
                    importDeck(shareDeckIdParam);
                    // Clear the URL parameter after handling
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('shareDeckId');
                    window.history.replaceState({}, document.title, newUrl.toString());
                },
                true // This is a confirmation dialog
            );
        }

        // If the user lands on login/signup page while already authenticated, redirect them to dashboard
        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
            window.location.href = "index.html";
        }

    } else {
        // User is signed out
        console.log("User is logged out.");
        // Hide all app pages
        hideAllAppPages();

        // If the user is on the dashboard page or any protected page, redirect to login
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
            window.location.href = "login.html";
        }
    }
});


// Apply saved theme on load (this will run before onAuthStateChanged, which is fine)
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
});


// --- Flashcard Deck Management (now using Firestore) ---

async function renderFlashcardSets() {
    if (!myDecksContainer) return; // Exit if element doesn't exist on this page (e.g., on login.html)
    myDecksContainer.innerHTML = '<p class="py-4 text-center">Loading your decks...</p>';

    const currentUser = auth.currentUser;
    if (!currentUser) {
        myDecksContainer.innerHTML = '<p class="py-4 text-center text-red-500">Please log in to view your decks.</p>';
        return;
    }

    try {
        // Query decks owned by the current user
        const q = query(collection(db, "decks"), where("ownerId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            myDecksContainer.innerHTML = '<p class="py-4 text-center">No decks yet. Click "+ Create Deck" to add one!</p>';
            return;
        }

        myDecksContainer.innerHTML = ''; // Clear loading message
        querySnapshot.forEach((doc) => {
            const set = { id: doc.id, ...doc.data() }; // Add Firestore document ID to the set object
            const cardCount = set.cards ? set.cards.length : 0;
            const deckItemElement = document.createElement('div');
            deckItemElement.className = 'deck-item';
            deckItemElement.innerHTML = `
                <span>${set.name} (${cardCount} cards)</span>
                <div class="deck-actions">
                    <button data-deck-id="${set.id}" data-action="edit-deck" title="Edit Deck Name/Timer">✏️</button>
                    <button data-deck-id="${set.id}" data-action="add-card" title="Add Card">+</button>
                    <button data-deck-id="${set.id}" data-action="view-cards" title="View Cards">👁️</button>
                    <button data-deck-id="${set.id}" data-action="start-quiz" title="Start Quiz">▶️</button>
                    <button data-deck-id="${set.id}" data-action="share-deck" title="Share Deck">🔗</button>
                    <button data-deck-id="${set.id}" data-action="delete-deck" title="Delete Deck">🗑️</button>
                </div>
            `;
            myDecksContainer.appendChild(deckItemElement);
        });

        // Add event listeners to the action buttons using event delegation on the container
        myDecksContainer.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const action = e.target.dataset.action;
                const deckId = e.target.dataset.deckId; // Get the Firestore ID of the deck

                // Fetch the current deck data for actions that need it
                let targetDeck = null;
                if (action !== 'delete-deck') { // No need to fetch if immediately deleting
                    const deckDoc = await getDoc(doc(db, "decks", deckId));
                    if (deckDoc.exists()) {
                        targetDeck = { id: deckDoc.id, ...deckDoc.data() };
                    } else {
                        showMessageBox('Error', 'Deck not found. Please refresh.');
                        return;
                    }
                }

                switch (action) {
                    case 'edit-deck':
                        openEditDeckModal(deckId);
                        break;
                    case 'add-card':
                        currentManagingDeckId = deckId; // Set the current deck for card creation
                        openCreateCardModal();
                        break;
                    case 'view-cards':
                        openDeckManagementPage(deckId); // Navigate to deck management page
                        break;
                    case 'start-quiz':
                        if (!targetDeck.cards || targetDeck.cards.length === 0) {
                            showMessageBox('No Cards', 'This deck has no cards to start a quiz.');
                            return;
                        }
                        const quizCardsForSession = targetDeck.cards.map(card => ({ ...card, answered: false, correct: false }));
                        startQuiz(quizCardsForSession, targetDeck.defaultTimer, 'quiz');
                        break;
                    case 'share-deck':
                        openShareDeckModal(deckId);
                        break;
                    case 'delete-deck':
                        deleteFlashcardDeck(deckId);
                        break;
                }
            });
        });

    } catch (error) {
        console.error("Error rendering flashcard sets:", error);
        myDecksContainer.innerHTML = '<p class="py-4 text-center text-red-500">Error loading decks.</p>';
    }
}

/**
 * Renders all shared flashcard sets dynamically in the shared decks panel.
 */
async function renderSharedFlashcardSets() {
    if (!sharedDecksContainer) return;
    sharedDecksContainer.innerHTML = '<p class="py-4 text-center">Loading shared decks...</p>';

    try {
        // Query the dedicated 'sharedDecks' collection
        const q = query(collection(db, "sharedDecks"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            sharedDecksContainer.innerHTML = '<p class="py-4 text-center">No decks have been shared yet.</p>';
            return;
        }

        sharedDecksContainer.innerHTML = ''; // Clear existing list
        querySnapshot.forEach((doc) => {
            const set = { id: doc.id, ...doc.data() }; // Add Firestore document ID
            const deckItemElement = document.createElement('div');
            deckItemElement.className = 'deck-item';
            deckItemElement.innerHTML = `
                <span>${set.name} (Shared by: ${set.ownerDisplayName || 'Unknown'})</span>
                <div class="deck-actions">
                    <button data-share-id="${set.shareId}" data-action="import-shared-deck" title="Import this Deck">📥</button>
                </div>
            `;
            sharedDecksContainer.appendChild(deckItemElement);
        });

        sharedDecksContainer.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const shareId = e.target.dataset.shareId;
                importDeck(shareId);
            });
        });

    } catch (error) {
        console.error("Error rendering shared flashcard sets:", error);
        sharedDecksContainer.innerHTML = '<p class="py-4 text-center text-red-500">Error loading shared decks.</p>';
    }
}


/**
 * Deletes a flashcard deck after user confirmation.
 * @param {string} deckId - The ID of the deck to delete.
 */
function deleteFlashcardDeck(deckId) {
    showMessageBox('Confirm Delete', 'Are you sure you want to delete this deck? This action cannot be undone.', async () => {
        try {
            await deleteDoc(doc(db, "decks", deckId));
            showMessageBox('Deleted', 'Flashcard deck deleted successfully.');
            renderFlashcardSets(); // Re-render the dashboard decks to update UI
        } catch (error) {
            console.error("Error deleting deck:", error);
            showMessageBox('Error', 'Failed to delete deck: ' + error.message);
        }
    }, true); // 'true' indicates this is a confirmation dialog
}


// --- Create/Edit Deck Modal Logic ---

async function openEditDeckModal(deckId) {
    if (!auth.currentUser) {
        showMessageBox('Error', 'Please log in to edit decks.');
        return;
    }
    currentManagingDeckId = deckId;
    try {
        const deckDoc = await getDoc(doc(db, "decks", deckId));
        if (deckDoc.exists() && deckDoc.data().ownerId === auth.currentUser.uid) {
            const deck = deckDoc.data();
            document.getElementById('createDeckModalTitle').textContent = 'Edit Deck';
            newDeckNameInput.value = deck.name;
            newDeckTimerInput.value = deck.defaultTimer;
            createDeckModal.classList.remove('hidden');
        } else {
            showMessageBox('Error', 'Deck not found or you do not have permission to edit it.');
        }
    } catch (error) {
        console.error("Error fetching deck for edit:", error);
        showMessageBox('Error', 'Failed to load deck for editing: ' + error.message);
    }
}


// --- Deck Management Page Logic ---

async function openDeckManagementPage(deckId) {
    if (!auth.currentUser) {
        showMessageBox('Error', 'Please log in to manage decks.');
        return;
    }
    currentManagingDeckId = deckId; // Set the current deck ID for card management

    try {
        const deckDoc = await getDoc(doc(db, "decks", deckId));
        if (deckDoc.exists() && deckDoc.data().ownerId === auth.currentUser.uid) {
            const deck = deckDoc.data();
            // Update display elements on the deck management page
            currentDeckNameDisplay.textContent = deck.name;
            deckCardCountDisplay.textContent = `${deck.cards ? deck.cards.length : 0} cards`;
            deckDefaultTimerDisplay.textContent = `${deck.defaultTimer}`;
            sessionQuizTimerInput.value = deck.defaultTimer; // Set session timer input to deck's default

            // Set initial radio button state for quiz modes
            if (modeFlashcardsRadio) modeFlashcardsRadio.checked = true; // Default to flashcards mode
            const modeTimerSetting = document.getElementById('mode-timer-setting');
            if (modeTimerSetting) modeTimerSetting.classList.add('hidden'); // Hide timer for flashcards mode

            renderCardsInDeckManagement(deckId, deck.cards || []); // Render cards for the selected deck
            showAppPage(deckManagementPage); // Show the deck management page
        } else {
            showMessageBox('Error', 'Deck not found or you do not have permission to view it. Returning to dashboard.');
            showAppPage(dashboardPage);
        }
    } catch (error) {
        console.error("Error opening deck management page:", error);
        showMessageBox('Error', 'Failed to load deck management page: ' + error.message);
        showAppPage(dashboardPage); // Fallback to dashboard
    }
}


function renderCardsInDeckManagement(deckId, cards) {
    if (!currentDeckCardsList) return;
    currentDeckCardsList.innerHTML = ''; // Clear existing card list

    if (cards.length === 0) {
        currentDeckCardsList.innerHTML = '<p class="py-4 text-center">No cards in this deck yet. Add some!</p>';
        return;
    }

    // Iterate through cards and create list items for each
    cards.forEach((card, cardIndex) => {
        const cardItemElement = document.createElement('div');
        cardItemElement.className = 'card-item-summary';
        // Display a truncated question and optionally a camera emoji if an image is present
        let cardContentSummary = `Card ${cardIndex + 1}: ${card.question?.substring(0, 50)}${card.question?.length > 50 ? '...' : ''}`;
        if (card.imageUrl) {
            cardContentSummary += ' 📸';
        }
        cardItemElement.innerHTML = `
            <span>${cardContentSummary}</span>
            <div class="card-actions">
                <button data-card-index="${cardIndex}" data-action="edit-card" title="Edit Card">✏️</button>
                <button data-card-index="${cardIndex}" data-action="delete-card" title="Delete Card">🗑️️</button>
            </div>
        `;
        currentDeckCardsList.appendChild(cardItemElement);
    });

    // Add event listeners for editing and deleting cards using delegation on the list container
    currentDeckCardsList.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', async (e) => {
            const action = e.target.dataset.action;
            const clickedCardIndex = parseInt(e.target.dataset.cardIndex);

            // Fetch the latest deck data to ensure we have the most current cards array
            const deckDoc = await getDoc(doc(db, "decks", deckId));
            if (!deckDoc.exists() || deckDoc.data().ownerId !== auth.currentUser.uid) {
                showMessageBox('Error', 'Deck not found or permission denied.');
                return;
            }
            const latestCards = deckDoc.data().cards || [];
            const targetCard = latestCards[clickedCardIndex];

            if (action === 'edit-card') {
                openCreateCardModal(targetCard, deckId, clickedCardIndex);
            } else if (action === 'delete-card') {
                deleteCardFromDeck(deckId, clickedCardIndex, latestCards);
            }
        });
    });

    if (deckCardCountDisplay) deckCardCountDisplay.textContent = `${cards.length} cards`; // Update card count display
}


function deleteCardFromDeck(deckId, cardIndex, currentCardsArray) {
    showMessageBox('Confirm Delete', 'Are you sure you want to delete this card? This action cannot be undone.', async () => {
        try {
            const updatedCards = [...currentCardsArray]; // Create a mutable copy
            updatedCards.splice(cardIndex, 1); // Remove the card

            const deckRef = doc(db, "decks", deckId);
            await updateDoc(deckRef, { cards: updatedCards }); // Update Firestore

            showMessageBox('Card Deleted', 'Card deleted successfully.');
            renderCardsInDeckManagement(deckId, updatedCards); // Re-render the card list with updated data
        } catch (error) {
            console.error("Error deleting card:", error);
            showMessageBox('Error', 'Failed to delete card: ' + error.message);
        }
    }, true);
}


// --- Create/Edit Card Modal Logic ---

function openCreateCardModal(cardData = null, deckId = null, cardIndex = null) {
    if (!auth.currentUser) {
        showMessageBox('Error', 'Please log in to add/edit cards.');
        return;
    }
    createCardForm?.reset(); // Clear form fields
    if (cardImagePreview) cardImagePreview.innerHTML = '<span class="placeholder-icon">📷</span>'; // Reset image preview
    if (createCardModalTitle) createCardModalTitle.textContent = 'Add New Card';
    if (deleteCardBtn) deleteCardBtn.style.display = 'none'; // Hide delete button by default for new cards

    // Set current editing context
    currentManagingDeckId = deckId;
    currentEditingCardIndex = cardIndex;

    if (cardData) {
        // Populate form fields if editing an existing card
        if (createCardModalTitle) createCardModalTitle.textContent = 'Edit Card';
        if (cardQuestionInput) cardQuestionInput.value = cardData.question || '';
        if (cardAnswerInput) cardAnswerInput.value = cardData.answer || '';
        if (cardImageURLInput) cardImageURLInput.value = cardData.imageUrl || '';
        if (cardData.imageUrl && cardImagePreview) {
            const img = document.createElement('img');
            img.src = cardData.imageUrl;
            // Handle image loading errors by showing a placeholder
            img.onerror = () => {
                img.src = "https://placehold.co/150x100/CCCCCC/000000?text=Image+Load+Error";
                img.alt = "Image Load Error";
            };
            cardImagePreview.innerHTML = ''; // Clear placeholder
            cardImagePreview.appendChild(img); // Show image preview
        }
        if (deleteCardBtn) deleteCardBtn.style.display = 'block'; // Show delete button when editing
    }
    createCardModal?.classList.remove('hidden'); // Show the modal
}


// --- Share Deck Functionality ---

async function openShareDeckModal(deckId) {
    if (!auth.currentUser) {
        showMessageBox('Error', 'Please log in to share decks.');
        return;
    }
    try {
        const deckDoc = await getDoc(doc(db, "decks", deckId));
        if (!deckDoc.exists() || deckDoc.data().ownerId !== auth.currentUser.uid) {
            showMessageBox('Error', 'Deck not found or you do not have permission to share it.');
            return;
        }
        const deckToShare = { id: deckDoc.id, ...deckDoc.data() };

        // Ensure the deck has a shareId; create one if it doesn't
        if (!deckToShare.shareId) {
            deckToShare.shareId = generateUniqueId();
            // Update the original deck in Firestore with the new shareId
            await updateDoc(doc(db, "decks", deckId), { shareId: deckToShare.shareId });
        }


        await setDoc(doc(db, "sharedDecks", deckToShare.shareId), {
            name: deckToShare.name,
            defaultTimer: deckToShare.defaultTimer,
            cards: deckToShare.cards,
            ownerId: deckToShare.ownerId,
            ownerDisplayName: deckToShare.ownerDisplayName,
            shareId: deckToShare.shareId // Store shareId within the document for easy lookup
        }, { merge: true }); // Use merge to update if exists, create if not

        const shareLink = `${window.location.origin}/index.html?shareDeckId=${deckToShare.shareId}`; // Adjusted link for index.html
        if (shareDeckLinkInput) shareDeckLinkInput.value = shareLink;
        shareDeckModal?.classList.remove('hidden');
        renderSharedFlashcardSets(); // Update shared decks list on dashboard
        showMessageBox('Deck Shared!', 'Your deck is now shareable. Copy the link!');
    } catch (error) {
        console.error("Error sharing deck:", error);
        showMessageBox('Error', 'Failed to share deck: ' + error.message);
    }
}



async function importDeck(shareId) {
    if (!auth.currentUser) {
        showMessageBox('Error', 'You must be logged in to import decks.');
        return;
    }
    try {
        const sharedDeckDoc = await getDoc(doc(db, "sharedDecks", shareId));

        if (sharedDeckDoc.exists()) {
            const deckToImport = sharedDeckDoc.data();

            // Check if a deck with the same name already exists in personal decks to avoid duplicates
            const q = query(collection(db, "decks"),
                            where("ownerId", "==", auth.currentUser.uid),
                            where("name", "==", deckToImport.name));
            const existingDecksSnapshot = await getDocs(q);

            if (!existingDecksSnapshot.empty) {
                showMessageBox('Already Exists', `A deck named "${deckToImport.name}" already exists in your collection.`);
                return;
            }

            // Create a new document in the user's personal 'decks' collection
            await addDoc(collection(db, "decks"), {
                name: deckToImport.name,
                defaultTimer: deckToImport.defaultTimer,
                cards: deckToImport.cards,
                ownerId: auth.currentUser.uid, // Assign to current user
                ownerDisplayName: currentUserFirestoreData?.displayName || auth.currentUser.email,
                // Do NOT copy the original shareId to the imported deck, it's a new copy
            });
            showMessageBox('Deck Imported', `Deck "${deckToImport.name}" imported successfully!`);
            renderFlashcardSets(); // Re-render user's decks
        } else {
            showMessageBox('Not Found', 'No shared deck found with that ID.');
        }
    } catch (error) {
        console.error("Error importing deck:", error);
        showMessageBox('Error', 'Failed to import deck: ' + error.message);
    }
}


// --- Quiz/Flashcard Mode Core Functionality ---


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}


function generateChoices(correctAnswer, allCards, numDistractors = 3) {
    let choices = [correctAnswer];
    let potentialDistractors = [];

    // Collect all other answers from the deck that are not the current card's answer
    allCards.forEach((card) => {
        if (card.answer !== correctAnswer && !potentialDistractors.includes(card.answer)) {
            potentialDistractors.push(card.answer);
        }
    });

    let genericDistractors = randomWords.filter(word => {
        return word !== correctAnswer && !potentialDistractors.includes(word);
    });

    // Combine potential distractors from deck and generic ones
    let combinedDistractors = shuffleArray(potentialDistractors.concat(genericDistractors));

    // Pick N unique distractors
    for (let i = 0; choices.length < (numDistractors + 1) && i < combinedDistractors.length; i++) {
        if (!choices.includes(combinedDistractors[i])) { // Ensure distractors are unique
            choices.push(combinedDistractors[i]);
        }
    }
    

    while (choices.length < (numDistractors + 1) && choices.length < (allCards.length + genericDistractors.length)) {
        const randomWord = genericDistractors[Math.floor(Math.random() * genericDistractors.length)];
        if (randomWord && !choices.includes(randomWord)) {
            choices.push(randomWord);
        } else if (genericDistractors.length === 0) {
             // Fallback if generic distractors are exhausted, just break
             break;
        }
    }


    return shuffleArray(choices); // Shuffle final choices
}



function startQuiz(cards, timerSeconds, mode) {
    if (cards.length === 0) {
        showMessageBox('No Cards', 'This flashcard set has no cards to quiz on!');
        return;
    }
    currentQuizSet = cards; // Assign the session-specific cards (with answered/correct properties)
    currentCardIndex = 0;
    quizTimeRemaining = timerSeconds;
    quizMode = mode; // Set the global quiz mode

    correctAnswersCount = 0; // Reset score for new session
    totalQuestionsAnswered = 0; // Reset total questions for new session

    // Adjust visibility of timer and score based on quiz mode
    if (quizMode === 'quiz') {
        quizTimerDisplay?.classList.remove('hidden');
        quizScoreDisplay?.classList.remove('hidden');
        startQuizTimer(); // Start timer only for quiz mode
    } else { // Flashcard mode
        quizTimerDisplay?.classList.add('hidden');
        quizScoreDisplay?.classList.add('hidden');
        stopQuizTimer(); // Ensure timer is stopped
    }

    renderQuizCard(); // Render the first card
    showAppPage(quizPage); // Navigate to the quiz page
}

/**
 * Updates the score display on the quiz page.
 */
function updateQuizScoreDisplay() {
    if (quizScoreDisplay) quizScoreDisplay.textContent = `Score: ${correctAnswersCount}/${totalQuestionsAnswered}`;
}

/**
 * Renders the current flashcard (question side) for the quiz/flashcard session.
 */
function renderQuizCard() {
    if (currentQuizSet.length === 0) {
        // Handle case where there are no cards
        if (quizQuestion) quizQuestion.textContent = "No more cards.";
        if (quizAnswer) quizAnswer.textContent = "No more cards.";
        if (quizImageFront) quizImageFront.classList.add('hidden');
        if (quizImageBack) quizImageBack.classList.add('hidden');
        if (quizCard) quizCard.classList.remove('flipped');
        if (quizChoiceButtons) quizChoiceButtons.classList.add('hidden');
        if (quizFeedbackDisplay) quizFeedbackDisplay.classList.add('hidden');
        updateQuizScoreDisplay();
        return;
    }

    const card = currentQuizSet[currentCardIndex];

    // Reset UI elements for the new card
    if (quizImageFront) {
        quizImageFront.classList.add('hidden');
        quizImageFront.src = '';
    }
    if (quizImageBack) {
        quizImageBack.classList.add('hidden');
        quizImageBack.src = '';
    }
    if (quizFeedbackDisplay) {
        quizFeedbackDisplay.classList.add('hidden');
        quizFeedbackDisplay.textContent = '';
    }
    if (quizCard) quizCard.classList.remove('flipped'); // Ensure card starts face down
    if (quizChoiceButtons) quizChoiceButtons.innerHTML = ''; // Clear previous choices

    // Display question content
    if (card.imageUrl && quizImageFront) {
        quizImageFront.src = card.imageUrl;
        quizImageFront.classList.remove('hidden');
        quizImageFront.onerror = () => {
            quizImageFront.src = "https://placehold.co/150x100/CCCCCC/000000?text=Image+Error";
            img.alt = "Image Error";
        };
    }
    if (quizQuestion) quizQuestion.textContent = card.question;

    // Initially hide choice buttons for quiz mode; they appear on flip
    if (quizChoiceButtons) quizChoiceButtons.classList.add('hidden');

    updateQuizScoreDisplay(); // Update score
}


function recordAnswer(isCorrect, chosenAnswer) {
    if (quizMode !== 'quiz' || currentQuizSet[currentCardIndex].answered) {
        // Only record if in 'quiz' mode and the current card hasn't been answered yet
        return;
    }

    const card = currentQuizSet[currentCardIndex];
    card.answered = true; // Mark card as answered for this session
    card.correct = isCorrect; // Record if the answer was marked correct
    totalQuestionsAnswered++; // Increment total questions attempted

    if (quizFeedbackDisplay) {
        if (isCorrect) {
            correctAnswersCount++; // Increment correct answers count
            quizFeedbackDisplay.textContent = 'Correct!';
            quizFeedbackDisplay.classList.remove('feedback-incorrect'); // Ensure correct class is applied
            quizFeedbackDisplay.classList.add('feedback-correct');
        } else {
            quizFeedbackDisplay.textContent = `Incorrect! The correct answer was: ${card.answer}`;
            quizFeedbackDisplay.classList.remove('feedback-correct'); // Ensure incorrect class is applied
            quizFeedbackDisplay.classList.add('feedback-incorrect');
        }
        quizFeedbackDisplay.classList.remove('hidden'); // Show feedback message
    }
    if (quizChoiceButtons) quizChoiceButtons.classList.add('hidden'); // Hide choice buttons after selection

    updateQuizScoreDisplay(); // Update the displayed score

    // Automatically proceed to the next card after a short delay for feedback display
    setTimeout(() => {
        if (currentCardIndex < currentQuizSet.length - 1) {
            currentCardIndex++; // Move to the next card
            renderQuizCard(); // Render the next card
        } else {
            // All cards in the set have been answered
            finishQuiz('cards_exhausted'); // End the quiz session, indicating cards exhausted
        }
    }, 2000); // 2-second delay to read feedback
}


function finishQuiz(reason = 'manual') {
    stopQuizTimer(); // Stop the countdown timer
    let finalMessage = `Session completed!`;

    if (quizMode === 'quiz') {
        if (reason === 'time_up') {
            finalMessage = `Time's up! Session completed.`;
        } else if (reason === 'cards_exhausted') {
            finalMessage = `All cards answered! Session completed.`;
        } else { // 'manual' or other
            finalMessage = `Quiz finished manually!`;
        }
        finalMessage += ` You answered ${correctAnswersCount} out of ${totalQuestionsAnswered} correctly.`;
        finalMessage += ` Your final score is ${correctAnswersCount}/${totalQuestionsAnswered}.`;
    } else { // Flashcard mode
        finalMessage += ` Hope you learned something.`;
    }
    showMessageBox('Session Finished', finalMessage, () => {
        showAppPage(dashboardPage); // Go back to dashboard after acknowledging message
    });
}


/**
 * Starts the countdown timer for the quiz mode.
 */
function startQuizTimer() {
    clearInterval(quizTimerInterval); // Clear any existing timer interval
    if (!quizTimerDisplay) return; // Ensure element exists before using

    quizTimerInterval = setInterval(() => {
        quizTimeRemaining--; // Decrement time
        const minutes = Math.floor(quizTimeRemaining / 60);
        const seconds = quizTimeRemaining % 60;
        quizTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (quizTimeRemaining <= 0) {
            stopQuizTimer(); // Stop timer when it reaches zero
            finishQuiz('time_up'); // End the quiz session, indicating time ran out
        }
    }, 1000); // Update every 1 second
}

/**
 * Stops the countdown timer.
 */
function stopQuizTimer() {
    clearInterval(quizTimerInterval);
}
