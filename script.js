// ==========================================
// 1. GLOBAL CONFIGURATIONS (Fully Configured)
// ==========================================
const BACKEND_URL = "http://92.4.141.75:3000";

// FIXED: Corrected base URL endpoint structure to target Cloudinary's upload engine API
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfqvmomaw/auto/upload"; 
const UPLOAD_PRESET = "mzyuvxdm";

// ==========================================
// 2. DOM ELEMENT HOOKS
// ==========================================
// Auth Interface
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const authTitle = document.getElementById('authTitle');
const authUsername = document.getElementById('authUsername');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthMode = document.getElementById('toggleAuthMode');

// Dashboard & Modals
const plusBtn = document.querySelector('.plus-btn');
const uploadModal = document.getElementById('uploadModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const mediaFileInput = document.getElementById('mediaFileInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const submitPostBtn = document.getElementById('submitPostBtn');
const postTextArea = document.getElementById('postTextArea');
const masterFeedStream = document.getElementById('masterFeedStream');

const adBtn = document.querySelector('.ad-btn');
const adModal = document.getElementById('adModal');
const closeAdModalBtn = document.getElementById('closeAdModalBtn');
const adBrandInput = document.getElementById('adBrandInput');
const adTextArea = document.getElementById('adTextArea');
const submitAdBtn = document.getElementById('submitAdBtn');

const navLinks = document.querySelectorAll('.nav-link');
const viewPanels = document.querySelectorAll('.view-panel');
const videoPromoBanner = document.getElementById('videoPromoBanner');

// NEW FEATURE HOOKS: Dynamic Panel Elements
const navNotificationsBtn = document.getElementById('navNotificationsBtn');
const navAdBtn = document.getElementById('navAdBtn');
const notificationsViewContainer = document.getElementById('notificationsViewContainer');
const adViewContainer = document.getElementById('adViewContainer');
const messagesViewPanel = document.getElementById('messagesViewPanel') || document.getElementById('messagesView');
const feedViewContainer = document.getElementById('feedViewContainer') || document.getElementById('homeView');

let isLoginMode = true;

// ==========================================
// 3. SECURE AUTHENTICATION SYSTEM
// ==========================================
toggleAuthMode.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.textContent = "Login to Handface";
        authUsername.style.display = "none";
        authSubmitBtn.textContent = "Log In";
        toggleAuthMode.textContent = "Sign Up";
    } else {
        authTitle.textContent = "Create Handface Account";
        authUsername.style.display = "block";
        authSubmitBtn.textContent = "Register";
        toggleAuthMode.textContent = "Log In";
    }
});

authSubmitBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    const username = authUsername.value.trim();

    if (!email || !password || (!isLoginMode && !username)) {
        alert("Please fill out all visible fields.");
        return;
    }

    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    const payload = isLoginMode ? { email, password } : { username, email, password };

    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (response.ok) {
            alert(result.message || "Authentication successful!");
            authContainer.style.display = "none";
            appContainer.style.display = "block";
            if (typeof loadFeedData === "function") loadFeedData(); 
        } else {
            alert(result.error || "Authentication failed.");
        }
    } catch (err) {
        alert("Authentication server unreachable. Verify Port 3000 is open in your Oracle Security List!");
    }
});

// ==========================================
// 4. WORKSPACE VIEW NAVIGATION
// ==========================================
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const linkText = link.textContent.trim().toLowerCase();
        viewPanels.forEach(panel => panel.classList.remove('active'));
        
        if (linkText === 'home') document.getElementById('homeView')?.classList.add('active');
        else if (linkText === 'messages') document.getElementById('messagesView')?.classList.add('active');
        else if (linkText === 'notifications') document.getElementById('notificationsView')?.classList.add('active');
    });
});

if (videoPromoBanner) {
    videoPromoBanner.addEventListener('click', () => { adModal.style.display = 'flex'; });
}

// UPDATED SLOT: Standard showView panel layout state controller
function showView(activePanel, activeBtn = null) {
    // Hide all main panels safely
    [feedViewContainer, messagesViewPanel, notificationsViewContainer, adViewContainer].forEach(panel => {
        if(panel) panel.classList.remove('active');
    });
    
    // Remove active markers from layout navigation system
    document.querySelectorAll('.bottom-nav .icon-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show requested workspace panel view target
    if(activePanel) activePanel.classList.add('active');
    if (activeBtn) activeBtn.classList.add('active');
}

// Dynamic Action Triggers with Element Fallback Validation
if (navNotificationsBtn) {
    navNotificationsBtn.addEventListener('click', () => {
        showView(notificationsViewContainer, navNotificationsBtn);
    });
}

if (navAdBtn) {
    navAdBtn.addEventListener('click', () => {
        showView(adViewContainer, navAdBtn);
    });
}

// ==========================================
// 5. POST ACTIONS WITH CLOUDINARY ENGINE
// ==========================================
if (plusBtn) {
    plusBtn.addEventListener('click', () => { uploadModal.style.display = 'flex'; });
}
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (uploadModal) {
    uploadModal.addEventListener('click', (e) => { if (e.target === uploadModal) closeModal(); });
}

if (mediaFileInput) {
    mediaFileInput.addEventListener('change', () => {
        fileNameDisplay.textContent = mediaFileInput.files.length > 0 ? mediaFileInput.files[0].name : "No file selected";
    });
}

if (submitPostBtn) {
    submitPostBtn.addEventListener('click', async () => {
        const textContent = postTextArea.value.trim();
        if (!textContent) { alert("Please write something first!"); return; }

        submitPostBtn.disabled = true;
        submitPostBtn.textContent = "Uploading Media... ⏳";
        let finalMediaUrl = "";

        try {
            if (mediaFileInput.files && mediaFileInput.files.length > 0) {
                const file = mediaFileInput.files[0];
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", UPLOAD_PRESET);

                const cloudResponse = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
                if (!cloudResponse.ok) throw new Error("Cloudinary media upload failed. Verify configurations!");
                const cloudData = await cloudResponse.json();
                finalMediaUrl = cloudData.secure_url;
            }

            submitPostBtn.textContent = "Saving to Database... 💾";
            const backendResponse = await fetch(`${BACKEND_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text_content: textContent, media_url: finalMediaUrl })
            });

            if (!backendResponse.ok) throw new Error("Database creation failed");
            const savedPost = await backendResponse.json();

            if (typeof renderPostToStream === "function") renderPostToStream(savedPost);
            closeModal();
        } catch (error) {
            alert("Post error: " + error.message);
        } finally {
            submitPostBtn.disabled = false;
            submitPostBtn.textContent = "Post to Feed";
        }
    });
}

function closeModal() {
    if (uploadModal) uploadModal.style.display = 'none';
    if (postTextArea) postTextArea.value = "";
    if (mediaFileInput) mediaFileInput.value = "";
    if (fileNameDisplay) fileNameDisplay.textContent = "No file selected";
}
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker Registered'));
}

