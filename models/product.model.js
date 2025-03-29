const  mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    name: String,
    price: Number,
    picture: String,
    bgcolor: String,
    textcolor: String,
    panelcolor: String,
    discount: {
        type: Number,
        default: 0
    },
})

module.exports = mongoose.model("product", productSchema);