const API_URL = "http://localhost:5000";
let votedCandidate = null;

// Ensure page is fully loaded before attaching event listeners
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("voterId").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            login();
        }
    });

    fetchCandidates();
});

// ✅ Login Function
function login() {
    let voterId = document.getElementById("voterId").value.trim();
    if (!voterId) {
        alert("Please enter a valid Voter ID");
        return;
    }

    document.getElementById("login").style.display = "none";
    document.getElementById("votingSection").style.display = "block";

    checkUserVote(voterId); // Check if the user has already voted
    fetchCandidates(); // Fetch candidates after login
}

// ✅ Fetch Candidates
async function fetchCandidates() {
    try {
        const response = await fetch(`${API_URL}/candidates`);
        if (!response.ok) throw new Error("Failed to fetch candidates");

        const candidates = await response.json();
        console.log("Fetched candidates:", candidates);

        let candidatesDiv = document.getElementById("candidates");
        if (!candidatesDiv) {
            console.error("Error: Element with ID 'candidates' not found!");
            return;
        }

        candidatesDiv.innerHTML = ""; // Clear previous entries

        candidates.forEach(candidate => {
            const candidateDiv = document.createElement("div");
            candidateDiv.classList.add("candidate");
            candidateDiv.innerHTML = `
                <h3>${candidate.name}</h3>
                <button class="vote-btn" onclick="vote('${candidate.name}')">Vote</button>
            `;
            candidatesDiv.appendChild(candidateDiv);
        });

        // Disable buttons if the user has already voted
        if (votedCandidate) disableVotingButtons();

    } catch (error) {
        console.error("Error loading candidates:", error);
        alert("Failed to load candidates. Please check your connection.");
    }
}

// ✅ Vote Function
async function vote(candidateName) {
    let voterId = document.getElementById("voterId").value;

    if (votedCandidate) {
        alert("You have already voted!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ voterId, candidate: candidateName }),
        });

        const data = await response.json();

        if (data.success) {
            votedCandidate = candidateName;
            alert(`Vote successfully recorded for ${candidateName}!`);
            document.getElementById("votedMessage").innerText = `You voted for: ${votedCandidate}`;

            disableVotingButtons();
            setTimeout(resetToLogin, 2000); // Redirect after 2 seconds
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error voting:", error);
        alert("Failed to cast vote. Please check your internet connection.");
    }
}

// ✅ Check if User Already Voted
async function checkUserVote(voterId) {
    try {
        const response = await fetch(`${API_URL}/check-vote?voterId=${voterId}`);
        const data = await response.json();

        if (data.voted) {
            votedCandidate = data.candidate;
            document.getElementById("votedMessage").innerText = `You voted for: ${votedCandidate}`;
            disableVotingButtons();
        }
    } catch (error) {
        console.error("Error checking vote:", error);
    }
}

// ✅ Disable Voting Buttons
function disableVotingButtons() {
    document.querySelectorAll(".vote-btn").forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
    });
}

// ✅ Reset to Login Page
function resetToLogin() {
    document.getElementById("voterId").value = "";
    document.getElementById("votedMessage").innerText = "";
    votedCandidate = null;

    document.getElementById("votingSection").style.display = "none";
    document.getElementById("login").style.display = "block";
}

// ✅ Go Back to Login Page
function goBack() {
    resetToLogin();
}
