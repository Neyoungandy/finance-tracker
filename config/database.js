const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("❌ MongoDB URI is missing in .env file!");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
        console.error(`❌ Database connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
