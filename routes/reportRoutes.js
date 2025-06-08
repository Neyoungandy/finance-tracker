const express = require("express");
const Report = require("../models/report");
const router = express.Router();

// Generate Monthly Report
router.get("/:userId", async (req, res) => {
    try {
        const reports = await Report.find({ userId: req.params.userId });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;
