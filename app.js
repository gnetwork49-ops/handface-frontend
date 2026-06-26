// ==========================================
// HANDFACE APP CONFIGURATION
// ==========================================

const BACKEND_URL = "http://92.4.141.75:3000";

const CLOUDINARY_CLOUD_NAME = "dfqvmomaw";

const CLOUDINARY_UPLOAD_PRESET = "mzyuvxdm";

const CLOUDINARY_URL =
`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

let authToken = localStorage.getItem("authToken") || "";

let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

// ==========================================
// DOM ELEMENTS
// ==========================================

const authContainer = document.getElementById("authContainer");
const appContainer = document.getElementById("appContainer");

const authTitle = document.getElementById("authTitle");
const authUsername = document.getElementById("authUsername");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const authSubmitBtn = document.getElementById("authSubmitBtn");
const toggleAuthMode = document.getElementById("toggleAuthMode");

const logoutBtn = document.getElementById("logoutBtn");

const globalAddContentBtn =
document.getElementById("globalAddContentBtn");

const uploadModal =
document.getElementById("uploadModal");

const closeModalBtn =
document.getElementById("closeModalBtn");

const submitPostBtn =
document.getElementById("submitPostBtn");

const postTextArea =
document.getElementById("postTextArea");

const mediaFileInput =
document.getElementById("mediaFileInput");

const fileNameDisplay =
document.getElementById("fileNameDisplay");

const masterFeedStream =
document.getElementById("masterFeedStream");

// ==========================================
// AUTH MODE
// ==========================================

let isLoginMode = true;

toggleAuthMode.onclick = () => {

    isLoginMode = !isLoginMode;

    if(isLoginMode){

        authTitle.innerText = "Login to Handface";

        authUsername.style.display = "none";

        authSubmitBtn.innerText = "Log In";

        toggleAuthMode.innerText =
        "Don't have an account? Sign Up";

    }else{

        authTitle.innerText =
        "Create Handface Account";

        authUsername.style.display = "block";

        authSubmitBtn.innerText =
        "Register";

        toggleAuthMode.innerText =
        "Already have an account? Log In";

    }

};

// ==========================================
// LOGIN / REGISTER
// ==========================================

authSubmitBtn.onclick = async ()=>{

    const username =
    authUsername.value.trim();

    const email =
    authEmail.value.trim();

    const password =
    authPassword.value.trim();

    if(!email || !password){

        alert("Fill all fields");

        return;

    }

    if(!isLoginMode && !username){

        alert("Enter username");

        return;

    }

    const endpoint =
    isLoginMode ?
    "/auth/login"
    :
    "/auth/register";

    const body =
    isLoginMode
    ?
    {
        email,
        password
    }
    :
    {
        username,
        email,
        password
    };

    try{

        const response =
        await fetch(BACKEND_URL+endpoint,{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify(body)

        });

        const result =
        await response.json();

        if(!response.ok){

            throw new Error(
                result.error ||
                "Authentication failed."
            );

        }

        authToken = result.token;

        currentUser =
        result.user;

        localStorage.setItem(
            "authToken",
            authToken
        );

        localStorage.setItem(
            "currentUser",
            JSON.stringify(currentUser)
        );

        authContainer.style.display="none";

        appContainer.style.display="block";

        loadFeed();

    }catch(err){

        alert(err.message);

    }

};

// ==========================================
// AUTO LOGIN
// ==========================================

window.addEventListener("load",()=>{

    if(authToken){

        authContainer.style.display="none";

        appContainer.style.display="block";

        loadFeed();

    }

});
// ==========================================
// MODAL CONTROLS
// ==========================================

globalAddContentBtn.addEventListener("click", () => {
    uploadModal.style.display = "flex";
});

closeModalBtn.addEventListener("click", () => {
    uploadModal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === uploadModal) {
        uploadModal.style.display = "none";
    }
});

// ==========================================
// FILE PICKER
// ==========================================

mediaFileInput.addEventListener("change", () => {

    if (mediaFileInput.files.length > 0) {

        fileNameDisplay.textContent =
            mediaFileInput.files[0].name;

    } else {

        fileNameDisplay.textContent =
            "No file selected";

    }

});

// ==========================================
// CLOUDINARY UPLOAD
// ==========================================

async function uploadMedia(file) {

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

    const response = await fetch(
        CLOUDINARY_URL,
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {

        throw new Error("Media upload failed.");

    }

    const data = await response.json();

    return data.secure_url;

}

// ==========================================
// CREATE POST
// ==========================================

submitPostBtn.addEventListener("click", async () => {

    const text =
        postTextArea.value.trim();

    if (!text) {

        alert("Write something first.");

        return;

    }

    submitPostBtn.disabled = true;

    submitPostBtn.innerText = "Posting...";

    try {

        let mediaUrl = "";

        if (mediaFileInput.files.length > 0) {

            mediaUrl =
                await uploadMedia(
                    mediaFileInput.files[0]
                );

        }

        const response =
            await fetch(
                `${BACKEND_URL}/posts`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${authToken}`

                    },

                    body: JSON.stringify({

                        text,

                        mediaUrl

                    })

                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to create post."
            );

        }

        uploadModal.style.display = "none";

        postTextArea.value = "";

        mediaFileInput.value = "";

        fileNameDisplay.textContent =
            "No file selected";

        loadFeed();

    } catch (err) {

        alert(err.message);

    }

    submitPostBtn.disabled = false;

    submitPostBtn.innerText = "Share Post";

});

// ==========================================
// LOAD FEED
// ==========================================

async function loadFeed() {

    try {

        const response =
            await fetch(
                `${BACKEND_URL}/posts`
            );

        const posts =
            await response.json();

        masterFeedStream.innerHTML = "";

        posts.reverse().forEach(post => {

            const card =
                document.createElement("div");

            card.className = "feed-card";

            let media = "";

            if (post.mediaUrl) {

                if (
                    post.mediaUrl.includes(".mp4") ||
                    post.mediaUrl.includes(".mov") ||
                    post.mediaUrl.includes(".webm")
                ) {

                    media = `
                        <video
                            class="feed-media"
                            controls>
                            <source src="${post.mediaUrl}">
                        </video>
                    `;

                } else {

                    media = `
                        <img
                            class="feed-media"
                            src="${post.mediaUrl}">
                    `;

                }

            }

            card.innerHTML = `

                <div class="feed-header">

                    <img
                        class="feed-avatar"
                        src="assets/default-avatar.png">

                    <div>

                        <div class="feed-name">
                            ${post.username || "User"}
                        </div>

                        <div class="feed-time">
                            ${new Date(
                                post.createdAt
                            ).toLocaleString()}
                        </div>

                    </div>

                </div>

                <div class="feed-text">

                    ${post.text}

                </div>

                ${media}

            `;

            masterFeedStream.appendChild(card);

        });

    } catch (err) {

        console.error(err);

    }

}
// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener("click", () => {

    if (!confirm("Are you sure you want to logout?")) return;

    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");

    authToken = "";
    currentUser = null;

    appContainer.style.display = "none";
    authContainer.style.display = "flex";

    authEmail.value = "";
    authPassword.value = "";
    authUsername.value = "";
});

// ==========================================
// PROFILE
// ==========================================

const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");
const profileName = document.getElementById("profileName");
const saveProfileBtn = document.getElementById("saveProfileBtn");

let avatarUrl = "";

if (avatarInput) {

    avatarInput.addEventListener("change", async () => {

        const file = avatarInput.files[0];

        if (!file) return;

        try {

            avatarPreview.src = URL.createObjectURL(file);

            avatarUrl = await uploadMedia(file);

        } catch (err) {

            alert(err.message);

        }

    });

}

if (saveProfileBtn) {

    saveProfileBtn.addEventListener("click", async () => {

        try {

            const response = await fetch(`${BACKEND_URL}/profile`, {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json",

                    Authorization: `Bearer ${authToken}`

                },

                body: JSON.stringify({

                    displayName: profileName.value,

                    avatar: avatarUrl

                })

            });

            if (!response.ok)
                throw new Error("Profile update failed.");

            alert("Profile updated!");

        } catch (err) {

            alert(err.message);

        }

    });

}

// ==========================================
// NAVIGATION
// ==========================================

const views = {
    home: document.getElementById("feedViewContainer"),
    profile: document.getElementById("profileViewContainer"),
    messages: document.getElementById("messagesViewPanel"),
    notifications: document.getElementById("notificationsViewContainer"),
    ads: document.getElementById("adViewContainer")
};

function showView(viewName) {

    Object.values(views).forEach(view => {

        if (view) view.classList.remove("active");

    });

    if (views[viewName]) {

        views[viewName].classList.add("active");

    }

}

document.getElementById("navHomeBtn")?.addEventListener("click", () => {
    showView("home");
});

document.getElementById("profileBtn")?.addEventListener("click", () => {
    showView("profile");
});

document.getElementById("navMessagesBtn")?.addEventListener("click", () => {
    showView("messages");
});

document.getElementById("navNotificationsBtn")?.addEventListener("click", () => {
    showView("notifications");
});

document.getElementById("navAdBtn")?.addEventListener("click", () => {
    showView("ads");
});

// ==========================================
// SIMPLE ADS
// ==========================================

const submitAdBtn = document.getElementById("submitAdBtn");
const adBrandInput = document.getElementById("adBrandInput");
const adTextArea = document.getElementById("adTextArea");

submitAdBtn?.addEventListener("click", () => {

    if (!adBrandInput.value || !adTextArea.value) {

        alert("Complete the advertisement.");

        return;

    }

    alert("Advertisement submitted.");

});

// ==========================================
// STARTUP
// ==========================================

console.log("Handface loaded successfully.");
