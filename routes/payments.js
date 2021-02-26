const express = require('express')
const router = express.Router()
const paymentsCtrl = require('../controllers/payments')
const authMiddleware = require('../middlewares/auth')

router.post('/payment-details', authMiddleware.handleToken, paymentsCtrl.savePaymentDetails)


router.post('/make-payment', authMiddleware.handleToken, paymentsCtrl.makePayment)

router.get('/get-payment-details', authMiddleware.handleToken, paymentsCtrl.getPaymentDetails)

router.get('/get-plan-details', paymentsCtrl.getPlanDetails)
module.exports = router
