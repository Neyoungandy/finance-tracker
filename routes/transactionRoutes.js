const express = require("express");
const Transaction = require("../models/transaction");
const router = express.Router();

// Add Transaction
router.post("/", async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ msg: "Server error" });
    }
});

// Get All Transactions
router.get("/", async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ msg: "Server error" });
    }
});

// Update Transaction
router.put("/:id", async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ msg: "Server error" });
    }
});

// Delete Transaction
router.delete("/:id", async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ msg: "Transaction deleted" });
    } catch (error) {
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;
