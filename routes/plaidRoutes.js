const express = require("express");
const { getAccessToken, getTransactions } = require("../controllers/plaidController");
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Initialize Plaid client
const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
        },
    },
});

const plaidClient = new PlaidApi(configuration);

router.post("/get-access-token", getAccessToken);
router.post("/get-transactions", getTransactions);

// Create link token
router.post('/create-link-token', auth, async (req, res) => {
    try {
        const request = {
            user: { client_user_id: req.user.userId },
            client_name: 'Finance Tracker',
            products: ['transactions'],
            country_codes: ['US'],
            language: 'en',
        };

        const response = await plaidClient.linkTokenCreate(request);
        res.json(response.data);
    } catch (error) {
        console.error('Create link token error:', error);
        res.status(500).json({ message: 'Error creating link token' });
    }
});

// Exchange public token for access token
router.post('/exchange-token', auth, async (req, res) => {
    try {
        const { public_token } = req.body;
        const request = {
            public_token: public_token,
        };

        const response = await plaidClient.itemPublicTokenExchange(request);
        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        // Store access token and item ID in user's profile
        // This should be implemented in your User model
        await User.findByIdAndUpdate(req.user.userId, {
            plaidAccessToken: accessToken,
            plaidItemId: itemId
        });

        res.json({ message: 'Token exchange successful' });
    } catch (error) {
        console.error('Exchange token error:', error);
        res.status(500).json({ message: 'Error exchanging token' });
    }
});

// Get transactions
router.get('/transactions', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user.plaidAccessToken) {
            return res.status(400).json({ message: 'No Plaid account connected' });
        }

        const { startDate, endDate } = req.query;
        const request = {
            access_token: user.plaidAccessToken,
            start_date: startDate,
            end_date: endDate,
        };

        const response = await plaidClient.transactionsGet(request);
        res.json(response.data);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});

// Get account balances
router.get('/balances', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user.plaidAccessToken) {
            return res.status(400).json({ message: 'No Plaid account connected' });
        }

        const request = {
            access_token: user.plaidAccessToken,
        };

        const response = await plaidClient.accountsBalanceGet(request);
        res.json(response.data);
    } catch (error) {
        console.error('Get balances error:', error);
        res.status(500).json({ message: 'Error fetching balances' });
    }
});

// Disconnect bank account
router.post('/disconnect', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user.plaidAccessToken) {
            return res.status(400).json({ message: 'No Plaid account connected' });
        }

        const request = {
            access_token: user.plaidAccessToken,
        };

        await plaidClient.itemRemove(request);

        // Remove Plaid credentials from user profile
        await User.findByIdAndUpdate(req.user.userId, {
            $unset: { plaidAccessToken: 1, plaidItemId: 1 }
        });

        res.json({ message: 'Bank account disconnected successfully' });
    } catch (error) {
        console.error('Disconnect account error:', error);
        res.status(500).json({ message: 'Error disconnecting account' });
    }
});

module.exports = router;
