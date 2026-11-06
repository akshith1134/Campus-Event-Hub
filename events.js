
const router = require("express").Router();
const jwt = require("jsonwebtoken");

const Event = require("./Event");
const User = require("./User");

// Verify logged-in user
async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Login required" });
        }

        const token = header.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "dev_secret_change_me"
        );

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();

    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// Admin-only access
function adminOnly(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required"
        });
    }

    next();
}

// Get all events
router.get("/", authenticate, async (req, res) => {
    try {
        const events = await Event.find()
            .populate("createdBy", "name email")
            .populate("attendees", "name email")
            .sort({ date: 1 });

        res.json(events);

    } catch (error) {
        res.status(500).json({ message: "Unable to load events" });
    }
});

// Admin creates event
router.post("/", authenticate, adminOnly, async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            venue,
            category,
            capacity
        } = req.body;

        if (!title || !description || !date || !venue || !category) {
            return res.status(400).json({
                message: "Please fill all required event fields"
            });
        }

        const event = await Event.create({
            title,
            description,
            date,
            venue,
            category,
            capacity: Number(capacity) || 100,
            createdBy: req.user._id,
            attendees: []
        });

        res.status(201).json({
            message: "Event created successfully",
            event
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Event creation failed" });
    }
});

// Student registers for event
router.post("/:id/register", authenticate, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can register"
            });
        }

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (event.attendees.some(id => id.toString() === req.user._id.toString())) {
            return res.status(409).json({
                message: "You already registered for this event"
            });
        }

        if (event.attendees.length >= event.capacity) {
            return res.status(400).json({
                message: "Event is full"
            });
        }

        event.attendees.push(req.user._id);
        await event.save();

        res.json({ message: "Successfully registered for event" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Registration failed" });
    }
});

// Student sees registered events
router.get("/mine/registered", authenticate, async (req, res) => {
    try {
        const events = await Event.find({
            attendees: req.user._id
        }).sort({ date: 1 });

        res.json(events);

    } catch (error) {
        res.status(500).json({
            message: "Unable to load your registrations"
        });
    }
});

// Admin views attendees for one event
router.get("/:id/attendees", authenticate, adminOnly, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate("attendees", "name email");

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.json({
            attendees: event.attendees
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to load attendees"
        });
    }
});

module.exports = router;
