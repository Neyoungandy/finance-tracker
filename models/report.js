const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly', 'custom'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    summary: {
        totalIncome: {
            type: Number,
            default: 0
        },
        totalExpenses: {
            type: Number,
            default: 0
        },
        netSavings: {
            type: Number,
            default: 0
        },
        categoryBreakdown: [{
            category: String,
            amount: Number,
            percentage: Number
        }]
    },
    insights: [{
        type: {
            type: String,
            enum: ['spending_trend', 'budget_alert', 'savings_opportunity', 'anomaly'],
            required: true
        },
        message: String,
        severity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        },
        data: mongoose.Schema.Types.Mixed
    }],
    charts: [{
        type: {
            type: String,
            enum: ['pie', 'bar', 'line', 'scatter'],
            required: true
        },
        title: String,
        data: mongoose.Schema.Types.Mixed,
        config: mongoose.Schema.Types.Mixed
    }],
    status: {
        type: String,
        enum: ['generating', 'completed', 'failed'],
        default: 'generating'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
ReportSchema.index({ userId: 1, type: 1, startDate: 1, endDate: 1 });

// Update the updatedAt timestamp before saving
ReportSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("Report", ReportSchema);
