const express = require('express')
const router = express.Router()
const industryCtrl = require('../controllers/industry')
const authMiddleware = require('../middlewares/auth')

router.get('/', authMiddleware.handleToken, industryCtrl.getIndustryInfo)

module.exports = router
