const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    monthlySpending: { type: Object, required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true }
});

module.exports = mongoose.model("Report", ReportSchema);
