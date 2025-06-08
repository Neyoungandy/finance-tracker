const express = require("express");
const { getAccessToken, getTransactions } = require("../controllers/plaidController");

const router = express.Router();

router.post("/get-access-token", getAccessToken);
router.post("/get-transactions", getTransactions);

module.exports = router;
