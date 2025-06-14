const express = require("express");
const Transaction = require("../models/transaction");
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Validation middleware
const validateTransaction = [
    body('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .isFloat({ min: 0 })
        .withMessage('Amount must be positive'),
    body('type')
        .isIn(['income', 'expense'])
        .withMessage('Type must be either income or expense'),
    body('category')
        .isIn([
            'food', 'transportation', 'housing', 'utilities',
            'entertainment', 'shopping', 'healthcare', 'education',
            'savings', 'investment', 'salary', 'other'
        ])
        .withMessage('Invalid category'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required'),
    body('paymentMethod')
        .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'])
        .withMessage('Invalid payment method')
];

// Add Transaction
router.post("/", [auth, validateTransaction], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const transaction = new Transaction({
            ...req.body,
            userId: req.user.id
        });

        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get All Transactions
router.get("/", auth, async (req, res) => {
    try {
        const { startDate, endDate, type, category, minAmount, maxAmount } = req.query;
        const query = { userId: req.user.id };

        // Apply filters
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (type) query.type = type;
        if (category) query.category = category;
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = parseFloat(minAmount);
            if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
        }

        const transactions = await Transaction.find(query)
            .sort({ date: -1 });

        res.json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get recent transactions
router.get('/recent', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id })
            .sort({ date: -1 })
            .limit(10);

        res.json(transactions);
    } catch (error) {
        console.error('Get recent transactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Transaction
router.put("/:id", [auth, validateTransaction], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        Object.assign(transaction, req.body);
        await transaction.save();

        res.json(transaction);
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Transaction
router.delete("/:id", auth, async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Export transactions
router.get('/export', auth, async (req, res) => {
    try {
        const { startDate, endDate, type, category } = req.query;
        const query = { userId: req.user.id };

        // Apply filters
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (type) query.type = type;
        if (category) query.category = category;

        const transactions = await Transaction.find(query)
            .sort({ date: -1 });

        // Convert to CSV
        const csv = transactions.map(t => {
            return [
                t.date.toISOString(),
                t.type,
                t.category,
                t.description,
                t.amount,
                t.currency,
                t.paymentMethod
            ].join(',');
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export transactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
