const express = require("express");
const Report = require("../models/report");
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/transaction');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } = require('date-fns');

// Generate Monthly Report
router.get("/:userId", async (req, res) => {
    try {
        const reports = await Report.find({ userId: req.params.userId });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ msg: "Server error" });
    }
});

// Helper function to get date range based on period
const getDateRange = (period) => {
  const now = new Date();
  switch (period) {
    case 'week':
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case 'quarter':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
      };
    case 'year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
  }
};

// Get income vs expenses report
router.get('/income-vs-expenses', auth, async (req, res) => {
  try {
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const transactions = await Transaction.find({
      userId: req.user.userId,
      date: { $gte: start, $lte: end },
    });

    const report = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.amount;
        } else {
          acc.expenses += transaction.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0 }
    );

    res.json(report);
  } catch (error) {
    console.error('Income vs expenses report error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Get category spending report
router.get('/category-spending', auth, async (req, res) => {
  try {
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const transactions = await Transaction.find({
      userId: req.user.userId,
      type: 'expense',
      date: { $gte: start, $lte: end },
    });

    const categorySpending = transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {});

    const report = Object.entries(categorySpending).map(([category, amount]) => ({
      category,
      amount,
    }));

    res.json(report);
  } catch (error) {
    console.error('Category spending report error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Get monthly trend report
router.get('/monthly-trend', auth, async (req, res) => {
  try {
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const transactions = await Transaction.find({
      userId: req.user.userId,
      date: { $gte: start, $lte: end },
    });

    const monthlyData = transactions.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toLocaleString('default', { month: 'short' });
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expenses += transaction.amount;
      }
      return acc;
    }, {});

    const report = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }));

    res.json(report);
  } catch (error) {
    console.error('Monthly trend report error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Get savings rate report
router.get('/savings-rate', auth, async (req, res) => {
  try {
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const transactions = await Transaction.find({
      userId: req.user.userId,
      date: { $gte: start, $lte: end },
    });

    const totals = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.amount;
        } else {
          acc.expenses += transaction.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0 }
    );

    const savingsRate = totals.income > 0
      ? ((totals.income - totals.expenses) / totals.income) * 100
      : 0;

    res.json([{ date: new Date().toISOString().split('T')[0], rate: savingsRate }]);
  } catch (error) {
    console.error('Savings rate report error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Export transactions as CSV
router.get('/export', auth, async (req, res) => {
  try {
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const transactions = await Transaction.find({
      userId: req.user.userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });

    const csvData = transactions.map(transaction => ({
      Date: new Date(transaction.date).toLocaleDateString(),
      Type: transaction.type,
      Category: transaction.category,
      Description: transaction.description,
      Amount: transaction.amount,
    }));

    // Convert to CSV
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${period}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Error exporting report' });
  }
});

module.exports = router;
