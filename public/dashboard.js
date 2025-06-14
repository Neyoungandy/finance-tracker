const API_URL = "https://finance-tracker-i66a.onrender.com/api";  // Actual Render API URL

// Authentication Check
if (!localStorage.getItem("token")) {
    alert("You must be logged in to access the dashboard.");
    window.location.href = "index.html";  // Redirect to login page
}

// Fetch Transactions & Display Edit/Delete Buttons
async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });
        const transactions = await response.json();

        const transactionList = document.getElementById("transactionList");
        transactionList.innerHTML = ""; // Clear previous entries

        transactions.forEach(tx => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                ${tx.date} - ${tx.description} - $${tx.amount} 
                <button onclick="editTransaction('${tx._id}', '${tx.description}', '${tx.amount}', '${tx.type}')">Edit</button>
                <button onclick="deleteTransaction('${tx._id}')">Delete</button>
            `;
            transactionList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error loading transactions:", error);
    }
}

// Handle Transaction Submission
document.getElementById("transactionForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const description = document.getElementById("transactionDescription").value;
    const amount = document.getElementById("transactionAmount").value;
    const type = document.getElementById("transactionType").value;

    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ description, amount, type })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Transaction added successfully!");
            loadTransactions(); // Refresh the transaction list
        } else {
            alert(data.msg || "Failed to add transaction.");
        }
    } catch (error) {
        console.error("Error adding transaction:", error);
        alert("Error adding transaction.");
    }
});

// Handle Budget Update
document.getElementById("budgetForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const budgetAmount = document.getElementById("budgetAmount").value;

    try {
        const response = await fetch(`${API_URL}/budgets`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ total: budgetAmount })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Budget updated successfully!");
            loadBudget();
        } else {
            alert(data.msg || "Failed to update budget.");
        }
    } catch (error) {
        console.error("Error updating budget:", error);
    }
});

// Load Budget Data & Trigger Alert
async function loadBudget() {
    try {
        const response = await fetch(`${API_URL}/budgets`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });
        const budgetData = await response.json();
        const budgetDetails = document.getElementById("budgetDetails");

        budgetDetails.innerHTML = `<p>Total Budget: $${budgetData.total}</p><p>Remaining: $${budgetData.remaining}</p>`;

        if (budgetData.remaining < 0) {
            alert("⚠ Warning: You have exceeded your budget!");
        }
    } catch (error) {
        console.error("Error loading budget details:", error);
    }
}

// Logout Functionality
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    alert("Logged out successfully!");
    window.location.href = "index.html";
});

// Load Dashboard Data on Page Load
window.onload = () => {
    loadTransactions();
    loadBudget();
};
