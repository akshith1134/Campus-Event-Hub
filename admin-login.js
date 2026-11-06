
const loginForm = document.getElementById("adminLoginForm");
const registerForm = document.getElementById("adminRegisterForm");
const toggleButton = document.getElementById("toggleButton");
const pageTitle = document.getElementById("pageTitle");
const message = document.getElementById("message");

let isRegisterMode = false;

toggleButton.addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;

  loginForm.classList.toggle("hidden", isRegisterMode);
  registerForm.classList.toggle("hidden", !isRegisterMode);

  pageTitle.textContent = isRegisterMode
    ? "Create Admin Account"
    : "Admin Login";

  toggleButton.textContent = isRegisterMode
    ? "Back to Admin Login"
    : "Create Admin Account";

  message.textContent = "";
});

// Admin registration
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const button = document.getElementById("registerButton");
  button.disabled = true;
  message.style.color = "blue";
  message.textContent = "Creating admin account...";

  const data = Object.fromEntries(
    new FormData(registerForm).entries()
  );

  try {
    const response = await fetch("/api/auth/admin-register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Admin registration failed");
    }

    message.style.color = "green";
    message.textContent =
      "Admin account created! You can now log in.";

    registerForm.reset();

    isRegisterMode = false;
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    pageTitle.textContent = "Admin Login";
    toggleButton.textContent = "Create Admin Account";

  } catch (error) {
    message.style.color = "red";
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

// Admin login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const button = document.getElementById("loginButton");
  button.disabled = true;
  message.style.color = "blue";
  message.textContent = "Checking credentials...";

  const data = Object.fromEntries(
    new FormData(loginForm).entries()
  );

  try {
    const response = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Admin login failed");
    }

    if (result.user.role !== "admin") {
      throw new Error("Admin access required");
    }

    localStorage.setItem("eventHubToken", result.token);
    localStorage.setItem("eventHubUser", JSON.stringify(result.user));

    message.style.color = "green";
    message.textContent = "Login successful!";

    window.location.href = "/index.html";

  } catch (error) {
    message.style.color = "red";
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
