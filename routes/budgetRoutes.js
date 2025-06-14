const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Budget = require('../models/budget'); // Fixed casing to match file system

// Validation middleware
const validateBudget = [
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isNumeric().withMessage('Amount must be a number')
        .isFloat({ min: 0 }).withMessage('Amount must be positive'),
    body('period').isIn(['daily', 'weekly', 'monthly', 'yearly'])
        .withMessage('Invalid period'),
    body('startDate').isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date')
];

// Get all budgets for a user
router.get('/', auth, async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.user.userId });
        res.json(budgets);
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ message: 'Error fetching budgets' });
    }
});

// Get active budgets
router.get('/active', auth, async (req, res) => {
    try {
        const currentDate = new Date();
        const budgets = await Budget.find({
            userId: req.user.userId,
            startDate: { $lte: currentDate },
            $or: [
                { endDate: { $gt: currentDate } },
                { endDate: null }
            ]
        });
        res.json(budgets);
    } catch (error) {
        console.error('Get active budgets error:', error);
        res.status(500).json({ message: 'Error fetching active budgets' });
    }
});

// Create a new budget
router.post('/', auth, validateBudget, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { category, amount, period, startDate, endDate, description } = req.body;
        
        const budget = new Budget({
            userId: req.user.userId,
            category,
            amount,
            period,
            startDate,
            endDate,
            description
        });

        await budget.save();
        res.status(201).json(budget);
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ message: 'Error creating budget' });
    }
});

// Update a budget
router.put('/:id', auth, validateBudget, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const budget = await Budget.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        const { category, amount, period, startDate, endDate, description } = req.body;
        
        budget.category = category;
        budget.amount = amount;
        budget.period = period;
        budget.startDate = startDate;
        budget.endDate = endDate;
        budget.description = description;

        await budget.save();
        res.json(budget);
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({ message: 'Error updating budget' });
    }
});

// Delete a budget
router.delete('/:id', auth, async (req, res) => {
    try {
        const budget = await Budget.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ message: 'Error deleting budget' });
    }
});

// Get budget progress
router.get('/:id/progress', auth, async (req, res) => {
    try {
        const budget = await Budget.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        // Calculate spent amount based on transactions
        const spent = await calculateSpentAmount(req.user.userId, budget.category, budget.period);
        
        const progress = {
            budget: budget.amount,
            spent: spent,
            remaining: budget.amount - spent,
            percentage: (spent / budget.amount) * 100
        };

        res.json(progress);
    } catch (error) {
        console.error('Get budget progress error:', error);
        res.status(500).json({ message: 'Error calculating budget progress' });
    }
});

// Helper function to calculate spent amount
async function calculateSpentAmount(userId, category, period) {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'daily':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case 'weekly':
            startDate = new Date(now.setDate(now.getDate() - now.getDay()));
            break;
        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const transactions = await Transaction.find({
        userId,
        category,
        type: 'expense',
        date: { $gte: startDate }
    });

    return transactions.reduce((total, transaction) => total + transaction.amount, 0);
}

module.exports = router;
