const userModel = require('../models/users.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {generateTokens} = require('../utils/generateTokens');
require('dotenv').config(); 

module.exports.registerUser = async function (req, res) {
    try {
        let { fullname, email, password ,role} = req.body;
        console.log("Request Body:", req.body); // Debug log

        if (!fullname || !email || !password) {
            return res.status(400).send("Please fill all the fields");
        }

        let user = await userModel.findOne({ email });
        if (user) {
            return res.status(400).send("User already exists");
        }

        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, async function (err, hash) {
                if (err) {
                    console.error("Error generating salt:", err); // Debug log
                    return res.status(500).send("Server error");
                } else {
                    let createUser = await userModel.create({
                        fullname,
                        email,
                        password: hash,
                        role,
                    });

                    let token = generateTokens(createUser);
                    res.cookie("token", token, {
                        httpOnly: true,
                        secure: false, // Set to true if using HTTPS
                        sameSite: "strict",
                    });

                    console.log("User registered successfully, redirecting to /shop");
                    res.redirect("/shop");
                }
            });
        });
    } catch (err) {
        console.error("Error in registerUser:", err);
        res.status(500).send("Server Error");
    }
};



module.exports.loginUser = async function (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send("Please fill all the fields");
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).send("User not found");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send("Invalid credentials");
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_KEY,
            { expiresIn: "1h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // Set to true if using HTTPS
            sameSite: "strict",
        });

        console.log("User logged in successfully");

        // Redirect based on role
        if (user.role === "admin") {
            return res.redirect("/admin");
        } else {
            return res.redirect("/shop");
        }
    } catch (err) {
        console.error("Error in loginUser:", err);
        res.status(500).send("Server Error");
    }
};

// module.exports.logoutUser = async function (req, res) {
//     res.clearCookie("token");
//     res.redirect("/register");
// };