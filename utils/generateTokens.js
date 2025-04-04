const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateTokens = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_KEY
    );
}
module.exports.generateTokens = generateTokens;