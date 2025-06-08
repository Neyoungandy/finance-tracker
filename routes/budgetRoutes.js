const express = require("express");
const Budget = require("../models/budget");
const router = express.Router();

// Add Budget
router.post("/", async (req, res) => {
    try {
        const budget = new Budget(req.body);
        await budget.save();
        res.status(201).json(budget);
    } catch (error) {
        res.status(500).json({ msg: "Server error" });
    }
});

// Get User Budgets
router.get("/", async (req, res) => {
    try {
        const budgets = await Budget.find();
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;
