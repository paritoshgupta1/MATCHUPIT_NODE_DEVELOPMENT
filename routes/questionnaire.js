const express = require('express')
const router = express.Router()
const qustionnnaireCtrl = require('../controllers/questionnaire')
const authMiddleware = require('../middlewares/auth')

router.post('/', authMiddleware.handleToken, qustionnnaireCtrl.addQuestionnaire)

router.get('/', authMiddleware.handleToken, qustionnnaireCtrl.getQuestionnaire)

module.exports = router
