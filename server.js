require("dotenv").config({ path: "./.env" });  // Load .env file
console.log("MongoDB URI:", process.env.MONGO_URI);  // Debugging output

const express = require("express");
const cors = require("cors");
const path = require("path"); // Required for serving static files
const connectDB = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const reportRoutes = require("./routes/reportRoutes");
const currencyRoutes = require("./routes/currencyRoutes");
const plaidRoutes = require("./routes/plaidRoutes");

const app = express();

//  Middleware Configuration
app.use(cors());
app.use(express.json());

//  Serve static frontend files correctly
app.use(express.static(path.join(__dirname, "public")));  // Ensuring proper path

// Connect to MongoDB
connectDB();

//  API Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/plaid", plaidRoutes);

//  Default Route
app.get("/", (req, res) => {
    res.send("Finance Tracker API is running...");
});

//  Server Initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
