const mongoose = require("mongoose");

const CurrencySchema = new mongoose.Schema({
    baseCurrency: { type: String, required: true },
    targetCurrency: { type: String, required: true },
    exchangeRate: { type: Number, required: true },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Currency", CurrencySchema);
