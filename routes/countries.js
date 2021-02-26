const express = require('express')
const router = express.Router()
const countriesCtrl = require('../controllers/countries')
const authMiddleware = require('../middlewares/auth')

router.get('/country-currency', authMiddleware.handleToken, countriesCtrl.getCountries)

module.exports = router
