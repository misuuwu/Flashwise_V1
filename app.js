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
const userDisplayNameElement = document.getElementById('user-display-name');
const userAvatarElement = document.querySelector('.user-avatar');
const myDecksContainer = document.getElementById('my-decks-container');
const sharedDecksContainer = document.getElementById('shared-decks-container');
const createDeckBtn = document.getElementById('create-deck-btn');
const importDeckBtn = document.getElementById('import-deck-btn');

// Deck Management specific elements (Corrected IDs to match index.html)
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

// Quiz specific elements (already largely correct, but ensure consistency)
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
let currentQuizDeckName = null; 

// Modal elements (existing, ensure IDs match index.html)
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


// --- Utility Functions (Provided in original app.js, ensuring they are here) ---

function showMessageBox(title, message, onOkCallback = null, showInput = false, inputType = 'text', inputPlaceholder = '', inputLabel = '', onConfirmCallback = null, onCancelCallback = null) {
    const messageBox = document.getElementById('messageBox');
    const messageBoxTitle = document.getElementById('messageBoxTitle');
    const messageBoxContent = document.getElementById('messageBoxContent');
    const messageBoxOkBtn = document.getElementById('messageBoxOkBtn');
    const messageBoxInputContainer = document.getElementById('messageBoxInputContainer');
    const messageBoxInputLabel = document.getElementById('messageBoxInputLabel');
    const messageBoxInput = document.getElementById('messageBoxInput');
    const messageBoxConfirmYesBtn = document.getElementById('messageBoxConfirmYesBtn');
    const messageBoxConfirmNoBtn = document.getElementById('messageBoxConfirmNoBtn');
    const messageBoxModalCloseX = document.getElementById('messageBoxModalCloseX');

    if (!messageBox || !messageBoxTitle || !messageBoxContent || !messageBoxOkBtn || !messageBoxInputContainer || !messageBoxInputLabel || !messageBoxInput || !messageBoxConfirmYesBtn || !messageBoxConfirmNoBtn || !messageBoxModalCloseX) {
        console.error('One or more message box elements not found. Falling back to alert.');
        alert(`${title}: ${message}`); // Fallback to native alert
        if (onOkCallback) onOkCallback();
        return;
    }

    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = message;

    messageBoxOkBtn.classList.add('hidden');
    messageBoxConfirmYesBtn.classList.add('hidden');
    messageBoxConfirmNoBtn.classList.add('hidden');

    if (showInput) {
        messageBoxInputContainer.classList.remove('hidden');
        messageBoxInputLabel.textContent = inputLabel;
        messageBoxInput.placeholder = inputPlaceholder;
        messageBoxInput.type = inputType; // Set input type
        messageBoxInput.value = '';
    } else {
        messageBoxInputContainer.classList.add('hidden');
    }

    if (onConfirmCallback && onCancelCallback) {
        messageBoxConfirmYesBtn.classList.remove('hidden');
        messageBoxConfirmNoBtn.classList.remove('hidden');

        messageBoxConfirmYesBtn.onclick = () => {
            messageBox.classList.add('hidden');
            onConfirmCallback(showInput ? messageBoxInput.value : null);
        };
        messageBoxConfirmNoBtn.onclick = () => {
            messageBox.classList.add('hidden');
            onCancelCallback();
        };
        messageBoxModalCloseX.onclick = () => {
            messageBox.classList.add('hidden');
            onCancelCallback();
        };
    } else {
        messageBoxOkBtn.classList.remove('hidden');
        messageBoxOkBtn.onclick = () => {
            messageBox.classList.add('hidden');
            if (onOkCallback) onOkCallback();
        };
        messageBoxModalCloseX.onclick = () => {
            messageBox.classList.add('hidden');
            if (onOkCallback) onOkCallback();
        };
    }

    messageBox.classList.remove('hidden');
}


function triggerShakeAnimation(element) {
    if (element) {
        element.classList.add('shake-animation');
        element.addEventListener('animationend', () => {
            element.classList.remove('shake-animation');
        }, { once: true });
    }
}


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
                        cards: [],
                        isShared: false, // Default to not shared
                        shareId: null, // No share ID initially
                        allowedUsers: [] // No allowed users initially
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

                // Pass the deck name to startQuiz
                startQuiz(quizCardsForSession, sessionTimer, quizMode, deck.name);
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
                    // The createCardModal will be hidden by deleteCardFromDeck's confirm callback
                    // No need to hide it immediately here
                } catch (error) {
                    console.error("Error preparing to delete card:", error);
                    showMessageBox('Error', 'Failed to delete card: ' + error.message);
                }
            }
        });
    }

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

    if (importDeckBtn) {
        importDeckBtn.addEventListener('click', () => {
            if (!auth.currentUser) {
                showMessageBox('Error', 'Please log in to import decks.');
                return;
            }
            // Correctly using onConfirmCallback to get the input value
            showMessageBox(
                'Import Deck',
                'Please enter the Share ID of the deck you want to import:',
                null, 
                true, 
                'text', 
                'Enter Share ID here', 
                'Share ID:', 
                (inputValue) => { 
                    if (inputValue) {
                        importDeck(inputValue.trim()); // Pass the trimmed input value
                    } else {
                        showMessageBox('Error', 'Share ID cannot be empty.');
                    }
                },
                () => { // onCancelCallback
                    showMessageBox('Import Cancelled', 'Deck import cancelled.');
                }
            );
        });
    }


    if (quizCard) {
        quizCard.addEventListener('click', () => {
            const card = currentQuizSet[currentCardIndex];

            // Toggle the 'flipped' class to show/hide the answer
            quizCard.classList.toggle('flipped');

            if (quizCard.classList.contains('flipped')) {
            
                if (card.imageUrl) {
                    // Use quizImageBack for the image on the flipped side
                    if (quizImageBack) {
                        quizImageBack.src = card.imageUrl;
                        quizImageBack.classList.remove('hidden');
                        quizImageBack.onerror = () => {
                            quizImageBack.src = "https://placehold.co/150x100/CCCCCC/000000?text=Image+Error";
                            quizImageBack.alt = "Image Error";
                        };
                    }
                    // Hide quizImageFront if it was showing
                    if (quizImageFront) quizImageFront.classList.add('hidden');
                } else {
                    // No image, ensure both image elements are hidden
                    if (quizImageBack) quizImageBack.classList.add('hidden');
                    if (quizImageFront) quizImageFront.classList.add('hidden');
                }


                if (quizMode === 'flashcards') { // Only show answer text in flashcard mode
                    if (quizAnswer) {
                        quizAnswer.textContent = card.answer;
                        quizAnswer.classList.remove('hidden'); // Ensure answer text is visible
                    }
                } else { // In quiz mode, hide the answer text on flip
                    if (quizAnswer) quizAnswer.classList.add('hidden');
                }


                if (quizMode === 'quiz' && quizChoiceButtons) {
                    // Only generate and display multiple choices if in quiz mode
                    quizChoiceButtons.classList.remove('hidden');
                    quizChoiceButtons.innerHTML = ''; // Clear previous buttons

                    const choices = generateChoices(card.answer, currentQuizSet, 3); // 3 distractors

                    choices.forEach(choiceText => {
                        const choiceBtn = document.createElement('button');
                        choiceBtn.textContent = choiceText;
                        // Add classes for text wrapping and overflow handling
                        choiceBtn.classList.add('btn-primary', 'py-3', 'text-base', 'text-wrap-fix');
                        choiceBtn.onclick = () => recordAnswer(choiceText === card.answer, choiceText);
                        quizChoiceButtons.appendChild(choiceBtn);
                    });
                } else if (quizMode === 'flashcards') {
                    // In flashcard mode, ensure choices and feedback are hidden
                    if (quizChoiceButtons) quizChoiceButtons.classList.add('hidden');
                    if (quizFeedbackDisplay) quizFeedbackDisplay.classList.add('hidden');
                }
            } else {
            
                if (card.imageUrl) {
                    if (quizImageFront) {
                        quizImageFront.src = card.imageUrl;
                        quizImageFront.classList.remove('hidden');
                        quizImageFront.onerror = () => {
                            quizImageFront.src = "https://placehold.co/150x100/CCCCCC/000000?text=Image+Error";
                            quizImageFront.alt = "Image Error";
                        };
                    }
                    // Hide quizImageBack if it was showing
                    if (quizImageBack) quizImageBack.classList.add('hidden');
                } else {
                    // No image, ensure both image elements are hidden
                    if (quizImageBack) quizImageBack.classList.add('hidden');
                    if (quizImageFront) quizImageFront.classList.add('hidden');
                }

                if (quizChoiceButtons) quizChoiceButtons.classList.add('hidden');
                if (quizFeedbackDisplay) quizFeedbackDisplay.classList.add('hidden'); 
                if (quizAnswer) quizAnswer.classList.add('hidden'); 
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
            finishQuiz('manual'); 
        });
    }

    console.log("Dashboard listeners initialized."); 
    hasInitializedDashboardListeners = true; 
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
        await renderFlashcardSets();
        await renderSharedFlashcardSets();

        // Handle potential deep linking for shared decks
        const urlParams = new URLSearchParams(window.location.search);
        const shareDeckIdParam = urlParams.get('shareDeckId');
        if (shareDeckIdParam) {
            // Using onConfirmCallback and onCancelCallback for Yes/No buttons
            showMessageBox(
                'Import Shared Deck',
                `Do you want to import the shared deck with ID: ${shareDeckIdParam}?`,
                null,
                false,
                'text',
                '',
                '',
                () => { // onConfirmCallback (Yes)
                    importDeck(shareDeckIdParam);
                    // Clear the URL parameter after handling
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('shareDeckId');
                    window.history.replaceState({}, document.title, newUrl.toString());
                },
                () => {

                    showMessageBox('Import Cancelled', 'You chose not to import the deck.');
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('shareDeckId');
                    window.history.replaceState({}, document.title, newUrl.toString());
                }
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
            // Ensure 'cards' array exists for count, default to 0 if not
            const cardCount = set.cards ? set.cards.length : 0;
            const deckItemElement = document.createElement('div');
            deckItemElement.className = 'deck-item';
            deckItemElement.innerHTML = `
                <span>${set.name} (${cardCount} cards)</span>
                <div class="deck-actions">
                    <button data-deck-id="${set.id}" data-action="edit-deck" title="Edit Deck Name/Timer"><i class="fas fa-pen"></i></button>
                    <button data-deck-id="${set.id}" data-action="add-card" title="Add Card"><i class="fas fa-plus"></i></button>
                    <button data-deck-id="${set.id}" data-action="view-cards" title="View Cards"><i class="fas fa-eye"></i></button>
                    <button data-deck-id="${set.id}" data-action="start-quiz" title="Start Quiz"><i class="fas fa-play"></i></button>
                    <button data-deck-id="${set.id}" data-action="share-deck" title="Share Deck"><i class="fas fa-share"></i></button>
                    <button data-deck-id="${set.id}" data-action="delete-deck" title="Delete Deck"><i class="fas fa-trash"></i></button>
                </div>
            `;
            myDecksContainer.appendChild(deckItemElement);
        });
        myDecksContainer.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const clickedButton = e.target.closest('button');
                if (!clickedButton) return;
                const action = clickedButton.dataset.action;
                const deckId = clickedButton.dataset.deckId;

                // Fetch the current deck data for actions that need it
                let targetDeck = null;
                if (action !== 'delete-deck') {
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
                        currentManagingDeckId = deckId;
                        openCreateCardModal();
                        break;
                    case 'view-cards':
                        openDeckManagementPage(deckId);
                        break;
                    case 'start-quiz':
                        if (!targetDeck.cards || targetDeck.cards.length === 0) {
                            showMessageBox('No Cards', 'This deck has no cards to start a quiz.');
                            return;
                        }
                        const quizCardsForSession = targetDeck.cards.map(card => ({ ...card, answered: false, correct: false }));
                        startQuiz(quizCardsForSession, targetDeck.defaultTimer, 'quiz', targetDeck.name);
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

// Function to generate a random unique ID (simple implementation)
function generateUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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

        // Add/Update the deck in the 'sharedDecks' collection
        await setDoc(doc(db, "sharedDecks", deckToShare.shareId), {
            name: deckToShare.name,
            defaultTimer: deckToShare.defaultTimer,
            cards: deckToShare.cards,
            ownerId: deckToShare.ownerId,
            ownerDisplayName: deckToShare.ownerDisplayName,
            shareId: deckToShare.shareId 
        }, { merge: true }); 

        const shareLink = `${window.location.origin}/index.html?shareDeckId=${deckToShare.shareId}`; 
        if (shareDeckLinkInput) shareDeckLinkInput.value = shareLink;
        shareDeckModal?.classList.remove('hidden');
        renderSharedFlashcardSets(); 
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
    if (!shareId) {
        showMessageBox('Error', 'No Share ID provided.');
        return;
    }

    try {
        const sharedDeckDocRef = doc(db, "sharedDecks", shareId);
        const sharedDeckDocSnap = await getDoc(sharedDeckDocRef);

        if (!sharedDeckDocSnap.exists()) {
            showMessageBox('Error', 'Invalid Share ID. Deck not found.');
            return;
        }

        const sharedDeckData = sharedDeckDocSnap.data();

        // Check if the user already owns a deck with the same originalShareId
        const userDecksQuery = query(
            collection(db, "decks"),
            where("ownerId", "==", auth.currentUser.uid),
            where("originalShareId", "==", sharedDeckData.shareId) // Check against the original shared deck's ID
        );
        const userDecksSnapshot = await getDocs(userDecksQuery);

        if (!userDecksSnapshot.empty) {
            showMessageBox('Already Imported', `You have already imported this deck: "${sharedDeckData.name}".`);
            return; // Prevent importing the same deck multiple times
        }

        // Check if the user already owns a deck with the same name (optional, for UX)
        const userDecksNameQuery = query(
            collection(db, "decks"),
            where("ownerId", "==", auth.currentUser.uid),
            where("name", "==", `${sharedDeckData.name} (Imported)`) // Check for the name that would be given to the imported deck
        );
        const userDecksNameSnapshot = await getDocs(userDecksNameQuery);

        if (!userDecksNameSnapshot.empty) {
            showMessageBox('Duplicate Deck Name', `You already have a deck named "${sharedDeckData.name} (Imported)". Please rename the imported deck if you proceed.`, () => {
                // User clicked OK on warning, proceed with import
                actuallyImportDeck(sharedDeckData);
            });
        } else {
            actuallyImportDeck(sharedDeckData);
        }

    } catch (error) {
        console.error("Error importing deck:", error);
        showMessageBox('Error', 'Failed to import deck: ' + error.message);
    }
}


async function actuallyImportDeck(deckData) {
    try {
        await addDoc(collection(db, "decks"), {
            name: `${deckData.name} (Imported)`,
            defaultTimer: deckData.defaultTimer,
            cards: deckData.cards || [],
            ownerId: auth.currentUser.uid,
            ownerDisplayName: currentUserFirestoreData?.displayName || auth.currentUser.email,
            originalShareId: deckData.shareId
        });
        showMessageBox('Deck Imported!', `Deck "${deckData.name}" has been imported successfully!`);
        renderFlashcardSets();
        renderSharedFlashcardSets();
    } catch (error) {
        console.error("Error saving imported deck:", error);
        showMessageBox('Error', 'Failed to save imported deck: ' + error.message);
    }
}

async function renderSharedFlashcardSets() {
    if (!sharedDecksContainer) return;
    sharedDecksContainer.innerHTML = '<p class="py-4 text-center">Loading shared decks...</p>';
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            sharedDecksContainer.innerHTML = '<p class="py-4 text-center text-red-500">Please log in to view shared decks.</p>';
            return;
        }

        // Query the 'sharedDecks' collection
        const q = query(collection(db, "sharedDecks"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            sharedDecksContainer.innerHTML = '<p class="py-4 text-center">No decks have been shared yet.</p>';
            return;
        }

        sharedDecksContainer.innerHTML = ''; // Clear existing list
        const sharedDecksToShow = [];

        for (const docSnapshot of querySnapshot.docs) {
            const set = { id: docSnapshot.id, ...docSnapshot.data() };

            const qPersonalCopy = query(
                collection(db, "decks"),
                where("ownerId", "==", currentUser.uid),
                where("originalShareId", "==", set.shareId)
            );
            const personalCopySnapshot = await getDocs(qPersonalCopy);
            const alreadyImported = !personalCopySnapshot.empty;


            if (!alreadyImported) {
                sharedDecksToShow.push(set);
            }
        }

        if (sharedDecksToShow.length === 0) {
            sharedDecksContainer.innerHTML = '<p class="py-4 text-center">No new decks have been shared with you.</p>';
        } else {
            sharedDecksToShow.forEach(set => {
                const ownerDisplayName = set.ownerDisplayName || 'Unknown';
                const deckItemElement = document.createElement('div');
                deckItemElement.className = 'deck-item';
                deckItemElement.innerHTML = `
                    <span>${set.name} (Shared by: ${ownerDisplayName})</span>
                    <div class="deck-actions">
                        <button data-share-id="${set.shareId}" data-action="import-shared-deck" title="Import Deck"><i class="fas fa-file-import"></i> Import</button>
                    </div>
                `;
                sharedDecksContainer.appendChild(deckItemElement);
            });

            sharedDecksContainer.querySelectorAll('button[data-action="import-shared-deck"]').forEach(button => {
                button.addEventListener('click', (e) => {
                    const shareId = e.target.closest('button').dataset.shareId;
                    importDeck(shareId);
                });
            });
        }
    } catch (error) {
        console.error("Error rendering shared flashcard sets:", error);
        sharedDecksContainer.innerHTML = '<p class="py-4 text-center text-red-500">Error loading shared decks.</p>';
    }
}



// --- Deck Management Page Functions ---

async function openDeckManagementPage(deckId) {
    if (!auth.currentUser) {
        showMessageBox('Error', 'Please log in to manage decks.');
        return;
    }
    currentManagingDeckId = deckId; // Set the current deck being managed

    try {
        const deckRef = doc(db, "decks", deckId);
        const deckDoc = await getDoc(deckRef);

        if (!deckDoc.exists() || deckDoc.data().ownerId !== auth.currentUser.uid) {
            showMessageBox('Error', 'Deck not found or you do not have permission to manage it.');
            showAppPage(dashboardPage); // Go back to dashboard if access denied
            return;
        }

        const deckData = deckDoc.data();
        if (currentDeckNameDisplay) currentDeckNameDisplay.textContent = deckData.name;
        if (deckDefaultTimerDisplay) deckDefaultTimerDisplay.textContent = `${deckData.defaultTimer} seconds`;
        if (sessionQuizTimerInput) sessionQuizTimerInput.value = deckData.defaultTimer; // Set default timer for quiz session

        // Render cards for this deck
        renderCardsInDeckManagement(deckId, deckData.cards || []);

        showAppPage(deckManagementPage);
    } catch (error) {
        console.error("Error opening deck management page:", error);
        showMessageBox('Error', 'Failed to open deck management: ' + error.message);
        showAppPage(dashboardPage); // Fallback to dashboard
    }
}


function renderCardsInDeckManagement(deckId, cards) {
    if (!currentDeckCardsList) return;
    currentDeckCardsList.innerHTML = ''; // Clear existing cards
    if (deckCardCountDisplay) deckCardCountDisplay.textContent = `${cards.length} cards`;


    if (cards.length === 0) {
        currentDeckCardsList.innerHTML = '<p class="text-center text-gray-500 py-4">No cards in this deck yet. Click "Add New Card"!</p>';
        return;
    }

    cards.forEach((card, index) => {
        const cardItemElement = document.createElement('div');
        cardItemElement.className = 'card-item';
        cardItemElement.innerHTML = `
            <div class="card-item-content">
                <strong>Q:</strong> ${card.question}<br>
                <strong>A:</strong> ${card.answer}
                ${card.imageUrl ? `<br><img src="${card.imageUrl}" alt="Card Image" class="card-item-image">` : ''}
            </div>
            <div class="card-item-actions">
                <button data-card-index="${index}" data-action="edit-card" title="Edit Card"><i class="fas fa-pen"></i></button>
            </div>
        `;
        currentDeckCardsList.appendChild(cardItemElement);
    });

    currentDeckCardsList.querySelectorAll('button[data-action="edit-card"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const cardIndex = parseInt(e.target.closest('button').dataset.cardIndex, 10);
            openCreateCardModal(cardIndex, deckId, cards[cardIndex]);
        });
    });
}


async function openCreateCardModal(cardIndex = null, deckId = null, cardData = null) {
    // Set currentManagingDeckId if provided, otherwise assume it's already set
    if (deckId) {
        currentManagingDeckId = deckId;
    } else if (!currentManagingDeckId) {
        showMessageBox('Error', 'No deck selected to add/edit card.');
        return;
    }

    currentEditingCardIndex = cardIndex; // Store the index if editing

    if (createCardModalTitle) {
        createCardModalTitle.textContent = cardIndex !== null ? 'Edit Card' : 'Add New Card';
    }

    // Populate form if editing existing card
    if (cardData) {
        cardQuestionInput.value = cardData.question || '';
        cardAnswerInput.value = cardData.answer || '';
        cardImageURLInput.value = cardData.imageUrl || '';
        if (cardData.imageUrl && cardImagePreview) {
            cardImagePreview.innerHTML = `<img src="${cardData.imageUrl}" alt="Card Image" class="card-item-image">`;
        } else if (cardImagePreview) {
            cardImagePreview.innerHTML = '<span class="placeholder-icon">📷</span>';
        }
        deleteCardBtn?.classList.remove('hidden'); // Show delete button when editing
    } else {
        // Clear form if adding new card
        cardQuestionInput.value = '';
        cardAnswerInput.value = '';
        cardImageURLInput.value = '';
        if (cardImagePreview) {
            cardImagePreview.innerHTML = '<span class="placeholder-icon">📷</span>';
        }
        deleteCardBtn?.classList.add('hidden'); // Hide delete button when adding new
    }
    createCardModal?.classList.remove('hidden');
}


async function deleteCardFromDeck(deckId, cardIndex, currentCardsArray) {
    showMessageBox(
        'Confirm Deletion',
        'Are you sure you want to delete this card? This action cannot be undone.',
        null,
        false,
        'text', null, null,
        async () => {
            try {
                const updatedCards = [...currentCardsArray];
                updatedCards.splice(cardIndex, 1);

                const deckRef = doc(db, "decks", deckId);
                await updateDoc(deckRef, { cards: updatedCards });

                showMessageBox('Card Deleted', 'Card deleted successfully.');
                renderCardsInDeckManagement(deckId, updatedCards);
                // After successful deletion, hide the create card modal
                createCardModal.classList.add('hidden');
            } catch (error) {
                console.error("Error deleting card:", error);
                showMessageBox('Error', 'Failed to delete card: ' + error.message);
            }
        },
        () => {
            showMessageBox('Cancelled', 'Card deletion cancelled.');

        }
    );
}

// --- Delete Deck Function ---
async function deleteFlashcardDeck(deckId) {
    if (!auth.currentUser) {
        showMessageBox('Error', 'You must be logged in to delete decks.');
        return;
    }
    showMessageBox(
        'Confirm Deletion',
        'Are you sure you want to delete this deck and all its cards? This action cannot be undone.',
        null, // No onOkCallback
        false, // No input field
        'text', null, null, // Default values for input related parameters
        async () => { // onConfirmCallback (Yes)
            try {
                // First, check if the user owns the deck
                const deckRef = doc(db, "decks", deckId);
                const deckDoc = await getDoc(deckRef);

                if (!deckDoc.exists() || deckDoc.data().ownerId !== auth.currentUser.uid) {
                    showMessageBox('Error', 'Deck not found or you do not have permission to delete it.');
                    return;
                }

                // Delete the deck from the 'decks' collection
                await deleteDoc(deckRef);

                // Additionally, if this deck was shared, remove it from the 'sharedDecks' collection
                // (Only if it exists there, which it should if it was shared)
                const sharedDeckDocRef = doc(db, "sharedDecks", deckDoc.data().shareId);
                const sharedDeckDocSnap = await getDoc(sharedDeckDocRef);
                if (sharedDeckDocSnap.exists()) {
                    await deleteDoc(sharedDeckDocRef);
                }


                showMessageBox('Deck Deleted', 'Deck deleted successfully.');
                renderFlashcardSets(); // Re-render personal decks
                renderSharedFlashcardSets(); // Re-render shared decks (in case it was one of yours that was removed)
            } catch (error) {
                console.error("Error deleting deck:", error);
                showMessageBox('Error', 'Failed to delete deck: ' + error.message);
            }
        },
        () => { // onCancelCallback (No)
            showMessageBox('Cancelled', 'Deck deletion cancelled.');
        }
    );
}


// --- Quiz/Flashcard Session Functions ---

function startQuiz(cards, timer, mode, deckName) {
    currentQuizSet = cards;
    currentCardIndex = 0;
    quizMode = mode;
    quizTimeRemaining = timer; // Use the provided timer
    correctAnswersCount = 0;
    totalQuestionsAnswered = 0;
    currentQuizDeckName = deckName; // Store the deck name

    showAppPage(quizPage);
    renderQuizCard();
    updateQuizScoreDisplay();

    if (quizMode === 'quiz') {
        startQuizTimer();
    } else {
        stopQuizTimer(); // Ensure timer is stopped for flashcard mode
        if (quizTimerDisplay) quizTimerDisplay.textContent = ''; // Clear timer display
    }

    if (quizFeedbackDisplay) quizFeedbackDisplay.classList.add('hidden'); // Hide feedback at start
    if (quizChoiceButtons) quizChoiceButtons.classList.add('hidden'); // Hide choices at start
}


function renderQuizCard() {
    if (currentQuizSet.length === 0) {
        // This case should ideally be caught before startQuiz is called
        showMessageBox('No Cards', 'No cards to display for this quiz session.');
        finishQuiz('no_cards');
        return;
    }

    const card = currentQuizSet[currentCardIndex];
    if (quizQuestion) quizQuestion.textContent = card.question;
    if (quizAnswer) quizAnswer.textContent = card.answer; // Answer is always set, but visibility depends on mode/flip state

    // Reset card flip state
    if (quizCard) quizCard.classList.remove('flipped');

    // Handle image display for the front of the card
    if (quizImageFront) {
        if (card.imageUrl) {
            quizImageFront.src = card.imageUrl;
            quizImageFront.classList.remove('hidden');
            quizImageFront.onerror = () => {
                quizImageFront.src = "https://placehold.co/150x100/CCCCCC/000000?text=Image+Error";
                quizImageFront.alt = "Image Error";
            };
        } else {
            quizImageFront.classList.add('hidden');
            quizImageFront.src = ''; // Clear image source
        }
    }
    // Ensure back image is hidden
    if (quizImageBack) {
        quizImageBack.classList.add('hidden');
        quizImageBack.src = '';
    }

    // Hide choice buttons and feedback when rendering a new card (before flip)
    if (quizChoiceButtons) quizChoiceButtons.classList.add('hidden');
    if (quizFeedbackDisplay) quizFeedbackDisplay.classList.add('hidden');
    // Ensure answer text is hidden on question side for all modes initially
    if (quizAnswer) quizAnswer.classList.add('hidden');

    // Update navigation button states
    if (prevCardBtn) prevCardBtn.disabled = currentCardIndex === 0;
    if (nextCardBtn) nextCardBtn.disabled = currentCardIndex === currentQuizSet.length - 1;
}


function startQuizTimer() {
    if (quizTimerInterval) clearInterval(quizTimerInterval); // Clear any existing timer

    if (quizTimerDisplay) quizTimerDisplay.classList.remove('hidden'); // Show timer display

    quizTimerInterval = setInterval(() => {
        quizTimeRemaining--;
        if (quizTimerDisplay) quizTimerDisplay.textContent = `Time: ${quizTimeRemaining}s`;

        if (quizTimeRemaining <= 0) {
            clearInterval(quizTimerInterval);
            finishQuiz('timer_expired');
        }
    }, 1000);
}


function stopQuizTimer() {
    if (quizTimerInterval) {
        clearInterval(quizTimerInterval);
        quizTimerInterval = null;
    }
}


function updateQuizScoreDisplay() {
    if (quizScoreDisplay) {
        quizScoreDisplay.textContent = `Score: ${correctAnswersCount}/${totalQuestionsAnswered}`;
    }
}


function recordAnswer(isCorrect, chosenAnswer = '') {
    const currentCard = currentQuizSet[currentCardIndex];
    if (currentCard.answered) return; // Prevent multiple answers for the same card

    currentCard.answered = true; // Mark card as answered
    totalQuestionsAnswered++;

    if (isCorrect) {
        correctAnswersCount++;
        if (quizFeedbackDisplay) {
            quizFeedbackDisplay.textContent = 'Correct!';
            quizFeedbackDisplay.className = 'text-lg font-bold mb-4 text-green-600'; // Green for correct
            quizFeedbackDisplay.classList.remove('hidden');
        }
    } else {
        if (quizFeedbackDisplay) {
            quizFeedbackDisplay.innerHTML = `Incorrect. The answer was: <span class="font-bold">${currentCard.answer}</span>`;
            quizFeedbackDisplay.className = 'text-lg font-bold mb-4 text-red-600'; // Red for incorrect
            quizFeedbackDisplay.classList.remove('hidden');
        }
    }
    updateQuizScoreDisplay();

    // Disable choice buttons after an answer is recorded
    if (quizChoiceButtons) {
        Array.from(quizChoiceButtons.children).forEach(button => {
            button.disabled = true;
            if (button.textContent === currentCard.answer) {
                button.classList.add('correct-answer-btn'); // Highlight correct answer
            } else if (button.textContent === chosenAnswer && !isCorrect) {
                button.classList.add('incorrect-answer-btn'); // Highlight chosen incorrect answer
            }
        });
    }

    // Automatically advance to the next card after a short delay for feedback
    setTimeout(() => {
        if (currentCardIndex < currentQuizSet.length - 1) {
            currentCardIndex++;
            renderQuizCard();
        } else {
            // All cards answered, finish the quiz
            finishQuiz('all_answered');
        }
    }, 1500); // 1.5 second delay
}


function finishQuiz(reason) {
    stopQuizTimer(); // Stop the timer regardless of how the quiz ended

    let message = '';
    switch (reason) {
        case 'timer_expired':
            message = 'Time\'s up! Quiz finished.';
            break;
        case 'manual':
            message = 'Quiz finished by user.';
            break;
        case 'all_answered':
            message = 'All cards answered. Quiz finished.';
            break;
        case 'no_cards':
            message = 'Quiz ended: No cards in this deck.';
            break;
        default:
            message = 'Quiz finished.';
            break;
    }

    const finalScoreMessage = `You answered ${correctAnswersCount} out of ${totalQuestionsAnswered} questions correctly in "${currentQuizDeckName}".`;

    showMessageBox(
        'Quiz Over',
        `${message}\n\n${finalScoreMessage}\n\nReturning to dashboard.`,
        () => {
            showAppPage(dashboardPage);
            // Reset quiz state (optional, as they will be re-initialized on next quiz start)
            currentQuizSet = [];
            currentCardIndex = 0;
            correctAnswersCount = 0;
            totalQuestionsAnswered = 0;
            currentQuizDeckName = null;
        }
    );
}


function generateChoices(correctAnswer, allCards, numDistractors) {
    const choices = [correctAnswer];
    const otherAnswers = allCards
        .map(card => card.answer)
        .filter(answer => answer !== correctAnswer); // Exclude the correct answer


    const shuffledDistractors = otherAnswers.sort(() => 0.5 - Math.random());
    let pickedDistractors = [];
    shuffledDistractors.forEach(distractor => {
        if (pickedDistractors.length < numDistractors && !choices.includes(distractor)) {
            pickedDistractors.push(distractor);
        }
    });


    while (pickedDistractors.length < numDistractors) {
        const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
        if (!choices.includes(randomWord) && !pickedDistractors.includes(randomWord)) {
            pickedDistractors.push(randomWord);
        }

        if (randomWords.length <= numDistractors && choices.every(c => randomWords.includes(c))) {
            break;
        }
    }

    choices.push(...pickedDistractors);


    return choices.sort(() => 0.5 - Math.random());
}