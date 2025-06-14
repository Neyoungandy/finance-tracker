const API_URL = "https://finance-tracker-i66a.onrender.com/api/auth";

// Show Modals for Login & Signup
document.getElementById("loginBtn").addEventListener("click", () => {
    const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
    loginModal.show();
});

document.getElementById("signupBtn").addEventListener("click", () => {
    const signupModal = new bootstrap.Modal(document.getElementById("signupModal"));
    signupModal.show();
});

// Handle Signup
document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.token);
            alert("Signup successful!");
            window.location.href = "dashboard.html"; 
        } else {
            alert(data.msg || "Signup failed");
        }
    } catch (error) {
        alert("Error signing up");
    }
});

// Handle Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.token);
            alert("Login successful!");
            window.location.href = "dashboard.html";
        } else {
            alert(data.msg || "Login failed");
        }
    } catch (error) {
        alert("Error logging in");
    }
});
