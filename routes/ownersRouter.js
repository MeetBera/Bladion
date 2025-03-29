const express = require('express');
const router = express.Router();
// const ownersController = require('../controllers/ownersController');
const ownerModel = require('../models/owner.model');

require('dotenv').config();
console.log(process.env.NODE_ENV);

if(process.env.NODE_ENV === "development"){
    router.post('/', async function(req, res) {
        let owners = await ownerModel.find();
        if(owners.length > 1){
            return res.status(500).send("you dont have permission to create a new owner");
        }
        res.send("you have permission to create a new owner");
    }); 
}

module.exports = router;