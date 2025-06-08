const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/:currency", async (req, res) => {
    try {
        const response = await axios.get(`https://api.currencylayer.com/live?access_key=${process.env.CURRENCY_LAYER_API_KEY}&currencies=${req.params.currency}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ msg: "Currency API error" });
    }
});

module.exports = router;
