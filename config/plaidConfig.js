const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
require("dotenv").config();

const plaidConfig = new Configuration({
    basePath: PlaidEnvironments.sandbox, // Change to production when deploying
    baseOptions: {
        headers: {
            "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
            "PLAID-SECRET": process.env.PLAID_SECRET,
        },
    },
});

const plaidClient = new PlaidApi(plaidConfig);

module.exports = plaidClient;
