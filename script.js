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
            loadFeedData(); // Populate database feed contents upon successful login
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
        
        if (linkText === 'home') document.getElementById('homeView').classList.add('active');
        else if (linkText === 'messages') document.getElementById('messagesView').classList.add('active');
        else if (linkText === 'notifications') document.getElementById('notificationsView').classList.add('active');
    });
});

if (videoPromoBanner) {
    videoPromoBanner.addEventListener('click', () => { adModal.style.display = 'flex'; });
}

// ==========================================
// 5. POST ACTIONS WITH CLOUDINARY ENGINE
// ==========================================
plusBtn.addEventListener('click', () => { uploadModal.style.display = 'flex'; });
closeModalBtn.addEventListener('click', closeModal);
uploadModal.addEventListener('click', (e) => { if (e.target === uploadModal) closeModal(); });

mediaFileInput.addEventListener('change', () => {
    fileNameDisplay.textContent = mediaFileInput.files.length > 0 ? mediaFileInput.files[0].name : "No file selected";
});

submitPostBtn.addEventListener('click', async () => {
    const textContent = postTextArea.value.trim();
    if (!textContent) { alert("Please write something first!"); return; }

    submitPostBtn.disabled = true;
    submitPostBtn.textContent = "Uploading Media... ⏳";
    let finalMediaUrl = "";

    try {
        if (mediaFileInput.files.length > 0) {
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

        renderPostToStream(savedPost);
        closeModal();
    } catch (error) {
        alert("Post error: " + error.message);
    } finally {
        submitPostBtn.disabled = false;
        submitPostBtn.textContent = "Post to Feed";
    }
});

function closeModal() {
    uploadModal.style.display = 'none';
    postTextArea.value = "";
    mediaFileInput.value = "";
    fileNameDisplay.textContent = "No file selected";
}

// ==========================================
// 6. SPONSORED ADVERTISEMENT GENERATOR
// ==========================================
adBtn.addEventListener('click', () => { adModal.style.display = 'flex'; });
closeAdModalBtn.addEventListener('click', closeAdModal);
adModal.addEventListener('click', (e) => { if (e.target === adModal) closeAdModal(); });

submitAdBtn.addEventListener('click', async () => {
    const brandName = adBrandInput.value.trim();
    const adContent = adTextArea.value.trim();
    if (!brandName || !adContent) { alert("Please fill out all advertisement details fields!"); return; }

    try {
        const response = await fetch(`${BACKEND_URL}/ads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brand_name: brandName, ad_content: adContent })
        });
        if (!response.ok) throw new Error("Ad generation failed");
        alert("Advertisement successfully deployed!");
        closeAdModal();
    } catch (error) {
        alert("Ad error: " + error.message);
    }
});

function closeAdModal() {
    adModal.style.display = 'none';
    adBrandInput.value = "";
    adTextArea.value = "";
}

// ==========================================
// 7. RENDER STREAM PIPELINES WITH ACTIONS
// ==========================================
function renderPostToStream(savedPost) {
    if (!masterFeedStream) return;

    const card = document.createElement('div');
    card.className = 'feed-card';

    // Build core content layout inside dynamic markup template
    let cardHTML = `
        <div class="post-header-row">
            <div class="post-user-info">👤 Anonymous</div>
        </div>
        <p class="post-text">${savedPost.text_content || ""}</p>
        ${savedPost.media_url ? `<img src="${savedPost.media_url}" class="feed-media" alt="Media content">` : ''}
    `;

    // INSERTED ACTION PANEL MARKUP SLOTS
    cardHTML += `
        <div class="post-actions">
            <button class="action-btn like-btn">❤️ Like</button>
            <button class="action-btn comment-btn">💬 Comment</button>
            <button class="action-btn share-btn">🔗 Share</button>
        </div>
    `;

    card.innerHTML = cardHTML;
    masterFeedStream.prepend(card);
}
