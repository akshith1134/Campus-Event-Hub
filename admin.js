
const token = localStorage.getItem("eventHubToken");
const user = JSON.parse(localStorage.getItem("eventHubUser") || "null");

if (!token || !user || user.role !== "admin") {
    window.location.href = "/admin-login.html";
}

const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
};

const $ = id => document.getElementById(id);

if ($("welcome")) $("welcome").textContent = `Admin: ${user.name}`;

if ($("logout")) {
    $("logout").onclick = () => {
        localStorage.removeItem("eventHubToken");
        localStorage.removeItem("eventHubUser");
        location.href = "/login.html";
    };
}

function safe(value = "") {
    return String(value).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    }[c]));
}

function formatDate(date) {
    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// Show create event form
if ($("showCreate")) {
    $("showCreate").onclick = () => {
        $("createPanel").classList.toggle("hidden");
    };
}

// Create event
$("eventForm").addEventListener("submit", async event => {
    event.preventDefault();

    const button = event.target.querySelector("button");
    button.disabled = true;

    try {
        const data = Object.fromEntries(
            new FormData(event.target).entries()
        );

        const response = await fetch("/api/events", {
            method: "POST",
            headers,
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        $("createMessage").textContent = "Event created successfully!";
        event.target.reset();
        $("createPanel").classList.add("hidden");

        await loadEvents();

    } catch (error) {
        $("createMessage").textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

// Load events
async function loadEvents() {
    try {
        const response = await fetch("/api/events", { headers });
        const events = await response.json();

        if (!response.ok) throw new Error(events.message);

        $("eventGrid").innerHTML = events.length
            ? events.map(event => `
                <article class="event-card">
                    <span class="tag">${safe(event.category)}</span>
                    <h3>${safe(event.title)}</h3>
                    <p>${safe(event.description)}</p>
                    <p>📅 ${formatDate(event.date)}</p>
                    <p>📍 ${safe(event.venue)}</p>
                    <p>${event.attendees.length}/${event.capacity} registered</p>

                    <button class="secondary"
                        data-attendees="${event._id}">
                        View Registrations
                    </button>
                </article>
            `).join("")
            : "<p>No events created yet.</p>";

    } catch (error) {
        $("mainMessage").textContent = error.message;
    }
}

// View registered students
$("eventGrid").addEventListener("click", async event => {
    const button = event.target.closest("[data-attendees]");
    if (!button) return;

    try {
        const response = await fetch(
            `/api/events/${button.dataset.attendees}/attendees`,
            { headers }
        );

        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        const attendees = result.attendees || [];

        alert(
            attendees.length
                ? "Registered students:\n\n" +
                  attendees.map((student, index) =>
                      `${index + 1}. ${student.name} - ${student.email}`
                  ).join("\n")
                : "No students registered yet."
        );

    } catch (error) {
        $("mainMessage").textContent = error.message;
    }
});

loadEvents();
