const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const router = express.Router();
const jwt = require("jsonwebtoken"); // Import JWT
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const { registerUser, loginUser } = require("../controllers/authController");
const userModel = require("../models/users.model");
const productsRouter = require("./productsRouter");


const authenticateUser = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        console.log("Token not found! Redirecting to login.");
        return res.redirect("/login");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded; // Set the user object
        next();
    } catch (err) {
        console.log("Invalid token:", err.message);
        res.redirect("/login");
    }
};

app.use("/products", productsRouter);

router.get("/createProduct", authenticateUser, (req, res) => {
    res.render("createProduct");
});

router.get("/register", (req, res) => {
    res.render("register"); 
});

router.post("/register", registerUser);


router.get("/login", (req, res) => {
    res.render("login"); 
});
router.post("/login", loginUser);

router.get("/", (req, res) => {
    res.redirect("/register"); 
});

router.get("/logout", (req, res) => {
    res.clearCookie("token"); // Clear the authentication token
    console.log("User logged out successfully");
    res.redirect("/register"); // Redirect to the login page
});



const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next(); // User is an admin, proceed to the next middleware or route handler
    } else {
        console.log("Access denied: User is not an admin");
        res.status(403).send("Access denied: You do not have permission to access this page.");
    }
};

const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../uploads");
        cb(null, uploadPath); // Save files in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + file.originalname;
        cb(null, uniqueSuffix); // Generate a unique filename
    },
});

const upload = multer({ storage });

router.get("/admin", authenticateUser, isAdmin, (req, res) => {
    try {
        // Read products from the JSON file
        const products = JSON.parse(fs.readFileSync(productsFilePath, "utf-8"));

        // Render the admin.ejs template with the products
        res.render("admin", { products });
    } catch (err) {
        console.error("Error loading admin dashboard:", err);
        res.status(500).send("Server Error");
    }
});

const productsFilePath = path.join(__dirname, "../data/products.json");


if (!fs.existsSync(productsFilePath)) {
    fs.writeFileSync(productsFilePath, JSON.stringify([]));
}

router.post("/products/create", upload.single("image"), (req, res) => {
    try {
        const { name, description, price, discount } = req.body;
        const image = req.file ? req.file.filename : null;

        // Debugging logs
        console.log("Uploaded file:", req.file);
        console.log("Request body:", req.body);

        // Read existing products from the JSON file
        const products = JSON.parse(fs.readFileSync(productsFilePath, "utf-8"));

        // Create a new product object
        const newProduct = {
            id: Date.now(), // Unique ID for the product
            name,
            description,
            price: parseFloat(price),
            discount: parseFloat(discount) || 0,
            image,
        };

        // Add the new product to the array
        products.push(newProduct);

        // Save the updated products array back to the JSON file
        fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));

        console.log("Product created successfully:", newProduct);

        // Redirect back to the admin dashboard
        res.redirect("/admin");
    } catch (err) {
        console.error("Error creating product:", err);
        res.status(500).send("Server Error");
    }
});

router.get("/cart", authenticateUser, async (req, res) => {
    try {
        // Fetch the user from the database
        const user = await userModel.findById(req.user.id);

        if (!user) {
            console.log("User not found");
            return res.redirect("/login");
        }

        // Render the cart.ejs template with the user's cart
        res.render("cart", { cart: user.cart });
    } catch (err) {
        console.error("Error loading cart page:", err);
        res.status(500).send("Server Error");
    }
});

router.post("/cart/add", authenticateUser, async (req, res) => {
    try {
        const { productId, name, price, quantity } = req.body;

        // Fetch the user from the database
        const user = await userModel.findById(req.user.id);

        if (!user) {
            console.log("User not found");
            req.flash("error", "User not found");
            return res.redirect("/shop");
        }

        // Ensure price and quantity are valid numbers
        const parsedPrice = parseFloat(price);
        const parsedQuantity = parseInt(quantity);

        if (isNaN(parsedPrice) || isNaN(parsedQuantity)) {
            console.log("Invalid price or quantity");
            req.flash("error", "Invalid product data");
            return res.redirect("/shop");
        }

        // Check if the product already exists in the cart
        const existingItem = user.cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += parsedQuantity;
        } else {
            // Add new item to the cart
            user.cart.push({
                productId,
                name,
                price: parsedPrice,
                quantity: parsedQuantity,
            });
        }

        // Save the updated user document
        await user.save();

        console.log("Item added to cart:", { productId, name, price: parsedPrice, quantity: parsedQuantity });
        req.flash("success", "Item added to cart successfully!");
        res.redirect("/shop");
    } catch (err) {
        console.error("Error adding item to cart:", err);
        req.flash("error", "An error occurred while adding the item to the cart.");
        res.redirect("/shop");
    }
});

router.post("/cart/remove", authenticateUser, async (req, res) => {
    try {
        const { productId } = req.body;

        // Fetch the user from the database
        const user = await userModel.findById(req.user.id);

        if (!user) {
            console.log("User not found");
            req.flash("error", "User not found");
            return res.redirect("/cart");
        }

        // Remove the item with the given productId from the cart
        user.cart = user.cart.filter(item => item.productId !== productId);

        // Save the updated user document
        await user.save();

        console.log("Item removed from cart:", productId);
        req.flash("success", "Item removed from cart successfully!");
        res.redirect("/cart");
    } catch (err) {
        console.error("Error removing item from cart:", err);
        req.flash("error", "An error occurred while removing the item from the cart.");
        res.redirect("/cart");
    }
});

router.post("/cart/update", authenticateUser, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Fetch the user from the database
        const user = await userModel.findById(req.user.id);

        if (!user) {
            console.log("User not found");
            req.flash("error", "User not found");
            return res.redirect("/cart");
        }

        // Ensure quantity is a valid number
        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            console.log("Invalid quantity");
            req.flash("error", "Invalid quantity");
            return res.redirect("/cart");
        }

        // Find the item in the cart and update its quantity
        const item = user.cart.find(item => item.productId === productId);
        if (item) {
            item.quantity = parsedQuantity; // Update the quantity
            console.log(`Updated quantity for product ${productId} to ${parsedQuantity}`);
        } else {
            console.log("Item not found in cart");
            req.flash("error", "Item not found in cart");
        }

        // Save the updated user document
        await user.save();

        req.flash("success", "Cart updated successfully!");
        res.redirect("/cart");
    } catch (err) {
        console.error("Error updating cart:", err);
        req.flash("error", "An error occurred while updating the cart.");
        res.redirect("/cart");
    }
});
router.get("/shop", authenticateUser, (req, res) => {
    try {
        // Read products from the JSON file
        const products = JSON.parse(fs.readFileSync(productsFilePath, "utf-8"));

        // Render the shop.ejs template with products and user data
        res.render("shop", {
            products,
            user: req.user, // Pass the authenticated user object
        });
    } catch (err) {
        console.error("Error loading shop page:", err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;