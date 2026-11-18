// routes/index.js - maps URLs to controller functions
const express = require('express');
const controller = require('../controllers/weatherController');
const validateCity = require('../middleware/validateCity');

const router = express.Router();

router.get('/', controller.showHome);                              // home page with the form
router.post('/search', validateCity, controller.search);           // form submit -> API -> result
router.get('/forecast', validateCity, controller.showForecast);    // result via link / choose another match
router.get('/popular', controller.showPopular);                    // quick links

module.exports = router;
