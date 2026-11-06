const form = document.getElementById("authForm");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const adminTab = document.getElementById("adminTab");
const adminRegisterTab = document.getElementById("adminRegisterTab");

const nameWrap = document.getElementById("nameWrap");
const setupKeyWrap = document.getElementById("setupKeyWrap");

const nameInput = form.elements.name;
const emailInput = form.elements.email;
const passwordInput = form.elements.password;
const setupKeyInput = form.elements.setupKey;

const btn = document.getElementById("authBtn");
const msg = document.getElementById("authMessage");
const hint = document.getElementById("authHint");

let mode = "login";

function setMode(newMode) {
    mode = newMode;

    loginTab.classList.toggle("active", mode === "login");
    registerTab.classList.toggle("active", mode === "register");
    adminTab.classList.toggle("active", mode === "admin");
    adminRegisterTab.classList.toggle("active", mode === "admin-register");

    const needsName = mode === "register" || mode === "admin-register";
    const needsSetupKey = mode === "admin-register";

    nameWrap.classList.toggle("hidden", !needsName);
    setupKeyWrap.classList.toggle("hidden", !needsSetupKey);

    nameInput.required = needsName;
    setupKeyInput.required = needsSetupKey;

    const labels = {
        login: "Student Login",
        register: "Create Student Account",
        admin: "Login as Admin",
        "admin-register": "Create Admin Account"
    };

    btn.textContent = labels[mode];

    if (mode === "login") {
        hint.textContent = "Login to discover and register for campus events.";
    } else if (mode === "register") {
        hint.textContent = "Create a student account to register for events.";
    } else if (mode === "admin") {
        hint.textContent = "Login using your administrator credentials.";
    } else {
        hint.textContent = "Create an administrator account using your setup key.";
    }

    msg.textContent = "";
}

loginTab.onclick = () => setMode("login");
registerTab.onclick = () => setMode("register");
adminTab.onclick = () => setMode("admin");
adminRegisterTab.onclick = () => setMode("admin-register");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    btn.disabled = true;
    msg.textContent = "Please wait...";

    const data = {
        email: emailInput.value.trim(),
        password: passwordInput.value
    };

    if (mode === "register" || mode === "admin-register") {
        data.name = nameInput.value.trim();
    }

    if (mode === "admin-register") {
        data.setupKey = setupKeyInput.value;
    }

    let endpoint;

    switch (mode) {
        case "login":
            endpoint = "/api/auth/login";
            break;

        case "register":
            endpoint = "/api/auth/register";
            break;

        case "admin":
            endpoint = "/api/auth/admin-login";
            break;

        case "admin-register":
            endpoint = "/api/auth/admin-register";
            break;
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const contentType = response.headers.get("content-type");

        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server returned HTML. Check backend API routes.");
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Request failed");
        }

        // Admin account created successfully
        if (mode === "admin-register") {
            msg.textContent = "Admin account created successfully! Please login.";
            passwordInput.value = "";
            setupKeyInput.value = "";
            setMode("admin");
            msg.textContent = "Admin account created successfully! Please login.";
            return;
        }

        // Student account created successfully
        if (mode === "register") {
            setMode("login");
            msg.textContent = "Student account created successfully! Please login.";
            passwordInput.value = "";
            return;
        }

        // Login success
        localStorage.setItem("eventHubToken", result.token);
        localStorage.setItem("eventHubUser", JSON.stringify(result.user));

        window.location.href = "/index.html";

    } catch (error) {
        msg.textContent = error.message;
    } finally {
        btn.disabled = false;
    }
});