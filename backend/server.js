require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Candidate Schema
const candidateSchema = new mongoose.Schema({
    name: String,
    votes: { type: Number, default: 0 }
});

// Voter Schema
const voterSchema = new mongoose.Schema({
    voterId: String,
    votedFor: String
});

const Candidate = mongoose.model("Candidate", candidateSchema);
const Voter = mongoose.model("Voter", voterSchema);

// ✅ Initialize Candidates (Run only once)
async function initializeCandidates() {
    const existingCandidates = await Candidate.find();
    if (existingCandidates.length === 0) {
        await Candidate.insertMany([
            { name: "Raj", votes: 0 },
            { name: "Priya", votes: 0 },
            { name: "Amit", votes: 0 }
        ]);
        console.log("Candidates added to database");
    }
}
initializeCandidates();

// ✅ Get Candidates (Without Votes)
app.get("/candidates", async (req, res) => {
    try {
        const candidates = await Candidate.find({}, { name: 1, _id: 0 });
        res.json(candidates);
    } catch (error) {
        console.error("Error fetching candidates:", error);
        res.status(500).json({ error: "Failed to fetch candidates" });
    }
});

// ✅ Vote API
app.post("/vote", async (req, res) => {
    const { voterId, candidate } = req.body;

    try {
        // Check if voter already voted
        const existingVote = await Voter.findOne({ voterId });
        if (existingVote) {
            return res.json({ success: false, error: `You already voted for ${existingVote.votedFor}` });
        }

        // Find candidate and update vote count
        const selectedCandidate = await Candidate.findOne({ name: candidate });
        if (!selectedCandidate) {
            return res.json({ success: false, error: "Candidate not found" });
        }

        selectedCandidate.votes += 1;
        await selectedCandidate.save();

        // Store voter record
        await Voter.create({ voterId, votedFor: candidate });

        res.json({ success: true, votedFor: candidate, message: `You voted for ${candidate}` });
    } catch (error) {
        console.error("Voting error:", error);
        res.status(500).json({ error: "Failed to cast vote" });
    }
});

// ✅ Check if User Voted
app.get("/check-vote", async (req, res) => {
    try {
        const { voterId } = req.query;
        const voter = await Voter.findOne({ voterId });

        if (voter) {
            res.json({ voted: true, candidate: voter.votedFor });
        } else {
            res.json({ voted: false });
        }
    } catch (error) {
        console.error("Error checking vote:", error);
        res.status(500).json({ error: "Failed to check vote" });
    }
});

// ✅ Admin - Get Election Results
app.get("/admin-results", async (req, res) => {
    try {
        const results = await Candidate.find({}, { name: 1, votes: 1, _id: 0 });
        res.json(results);
    } catch (error) {
        console.error("Error fetching results:", error);
        res.status(500).json({ error: "Failed to fetch results" });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
