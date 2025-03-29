const express = require('express');
const router = express.Router();
// const ownersController = require('../controllers/ownersController');

router.get('/', function(req, res) {
    res.send('hey ');
});

module.exports = router;