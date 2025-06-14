const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    period: {
        type: String,
        required: true,
        enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        default: null
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    currency: {
        type: String,
        default: 'USD'
    },
    alerts: {
        enabled: {
            type: Boolean,
            default: true
        },
        threshold: {
            type: Number,
            default: 80, // Alert when 80% of budget is used
            min: 0,
            max: 100
        }
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    notes: {
        type: String,
        trim: true
    }
});

// Update the updatedAt timestamp before saving
BudgetSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for faster queries
BudgetSchema.index({ userId: 1, category: 1 });
BudgetSchema.index({ userId: 1, startDate: 1, endDate: 1 });

// Virtual for checking if budget is active
BudgetSchema.virtual('isActive').get(function() {
    const now = new Date();
    return this.status === 'active' && now >= this.startDate && now <= this.endDate;
});

module.exports = mongoose.model("Budget", BudgetSchema);
