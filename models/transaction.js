const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'food', 'transportation', 'housing', 'utilities', 
            'entertainment', 'shopping', 'healthcare', 'education',
            'savings', 'investment', 'salary', 'other'
        ]
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    currency: {
        type: String,
        default: 'USD'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    tags: [{
        type: String,
        trim: true
    }],
    location: {
        type: String,
        trim: true
    },
    receipt: {
        type: String // URL to receipt image/document
    }
});

// Index for faster queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });

// ✅ Prevent model overwrite error
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;
