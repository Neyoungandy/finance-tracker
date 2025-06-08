const plaidClient = require("../config/plaidConfig");

const getAccessToken = async (req, res) => {
    try {
        const { public_token } = req.body;
        const response = await plaidClient.exchangePublicToken(public_token);
        res.json({ access_token: response.access_token });
    } catch (error) {
        console.error("Error getting access token:", error);
        res.status(500).json({ error: "Failed to get access token" });
    }
};

const getTransactions = async (req, res) => {
    try {
        const { access_token } = req.body;
        const response = await plaidClient.getTransactions(access_token, "2024-01-01", "2025-06-07");
        res.json({ transactions: response.transactions });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
};

module.exports = { getAccessToken, getTransactions };
