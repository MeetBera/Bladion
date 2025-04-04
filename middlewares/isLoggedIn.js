const jwt = require('jsonwebtoken');
const userModel = require('../models/users.model');


module.exports = async function (req, res, next) {
    if(!req.cookies.token) {
        req.flash("you are not logged in");
        return res.redirect('/');
    }
    try{
        let decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
        let user = await userModel
        .findOne({email: decoded.email})
        .select('-password')
        
        if(!user) {
            req.flash("you are not logged in");
            return res.redirect('/');
        }
        req.user = user;
        next();
    }catch(err){
        req.flash("you are not logged in");
        return res.redirect('/');
    }
}