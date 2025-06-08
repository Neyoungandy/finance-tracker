const axios = require("axios");
require("dotenv").config();

const getExchangeRate = async (fromCurrency, toCurrency) => {
    const url = `http://api.currencylayer.com/live?access_key=${process.env.CURRENCY_LAYER_API_KEY}&currencies=${toCurrency}&source=${fromCurrency}&format=1`;

    try {
        const response = await axios.get(url);
        return response.data.quotes[`${fromCurrency}${toCurrency}`];
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        return null;
    }
};

module.exports = getExchangeRate;
