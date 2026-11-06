
const token = localStorage.getItem("eventHubToken");
const user = JSON.parse(localStorage.getItem("eventHubUser") || "null");

if (!token || !user || user.role !== "student") {
    window.location.href = "/login.html";
}

const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
};

const $ = id => document.getElementById(id);

if ($("welcome")) $("welcome").textContent = `Hi, ${user.name}`;

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
                    <p>${event.attendees.length}/${event.capacity} seats</p>

                    <button class="primary"
                        data-register="${event._id}">
                        Register
                    </button>
                </article>
            `).join("")
            : "<p>No events available.</p>";

    } catch (error) {
        $("mainMessage").textContent = error.message || "Could not load events.";
    }
}

$("eventGrid").addEventListener("click", async event => {
    const button = event.target.closest("[data-register]");
    if (!button) return;

    button.disabled = true;

    try {
        const response = await fetch(
            `/api/events/${button.dataset.register}/register`,
            { method: "POST", headers }
        );

        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        $("mainMessage").textContent = result.message;
        await loadEvents();
        await loadMine();

    } catch (error) {
        $("mainMessage").textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

async function loadMine() {
    try {
        const response = await fetch("/api/events/mine/registered", { headers });
        const events = await response.json();

        $("myEvents").innerHTML = events.length
            ? events.map(event => `
                <article class="event-card compact">
                    <h3>${safe(event.title)}</h3>
                    <p>📅 ${formatDate(event.date)}</p>
                    <p>📍 ${safe(event.venue)}</p>
                </article>
            `).join("")
            : "<p>You haven't registered for any events.</p>";

    } catch {
        $("myEvents").innerHTML = "Unable to load your registrations.";
    }
}

if ($("refreshMine")) $("refreshMine").onclick = loadMine;

loadEvents();
loadMine();
