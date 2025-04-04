const  mongoose = require("mongoose");
const config = require("config");
const dbgr = require("debug")("Development:mongoose");

mongoose
.connect(`${config.get('MONGODB_URL')}/bladion`)   
.then(() => {
    dbgr("Database Connected");
})
.catch((err) => {
    dbgr("Database Error", err);
})

module.exports = mongoose.connection;