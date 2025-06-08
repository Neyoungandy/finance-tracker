require("dotenv").config({ path: "./.env" });  // Explicitly load .env file
console.log("MongoDB URI:", process.env.MONGO_URI);  // Debugging output

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const plaidRoutes = require("./routes/plaidRoutes");
const authRoutes = require("./routes/authRoutes");  // Import authentication routes
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const reportRoutes = require("./routes/reportRoutes");
const currencyRoutes = require("./routes/currencyRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from the "public" folder
app.use(express.static("public"));

connectDB(); // Connect to MongoDB
app.use("/api/auth", authRoutes);  // Enable authentication routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/plaid", plaidRoutes);

app.get("/", (req, res) => {
    res.send("Finance Tracker API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
