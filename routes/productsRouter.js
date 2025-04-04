const express = require('express');
const router = express.Router();
// const ownersController = require('../controllers/ownersController');
const product = require('../models/product.model');

router.get("/create", (req, res) => {
    res.render("createProduct");
});

// Handle Product Creation (POST)
router.post("/create", async (req, res) => {
    try {
        const { name, description, price } = req.body;
        if (!name || !description || !price) {
            return res.status(400).send("All fields are required.");
        }

        // Save to database
        const newProduct = new Product({ name, description, price });
        await newProduct.save();

        res.redirect("/shop"); // Redirect to the shop page after creation
    } catch (err) {
        console.error("Error creating product:", err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;