const  mongoose = require("mongoose");

const ownerSchema = mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        minlength: 3,
        trim: true,
    },
    email: String,
    password: String, 
    cart: {
        type: Array,
        default: []
    },
    products: {
        type: Array,
        default: []
    },
    gstin: String,
    picture: String,
})

module.exports = mongoose.model("owner", ownerSchema);