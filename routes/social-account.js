const express = require('express')
const router = express.Router()
const socialAccountCtrl = require('../controllers/social-account')

router.post('/', socialAccountCtrl.socialAccountHandler)

module.exports = router
