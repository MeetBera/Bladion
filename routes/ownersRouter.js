require('dotenv').config();
const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner.model');


console.log(process.env.NODE_ENV);

if(process.env.NODE_ENV === "development"){
    router.post('/create', async function(req, res) {
        let owners = await ownerModel.find();
        if(owners.length > 1){
            return res.status(500).send("you dont have permission to create a new owner");
        }
        let {fullname, email, password,role} = req.body;
        let createOwner = await ownerModel.create({
            fullname,
            email,
            password,
            role,
        })
        res.status(201).send(createOwner);
    }); 
}

module.exports = router;