const express = require('express')
const router = express.Router()
const adminCtrl = require('../controllers/admin')
const authMiddleware = require('../middlewares/auth')

router.post('/admin-login', adminCtrl.adminLogin)

router.post('/user-count', authMiddleware.handleToken ,adminCtrl.countUsers)

router.get('/payment-status', authMiddleware.handleToken , adminCtrl.paymentStatus)

router.post('/update',authMiddleware.handleToken, adminCtrl.updateSchema)

router.get('/get-revenue', adminCtrl.getRevenue)

router.get('/get-about-to-expire-users', adminCtrl.getAboutToExpireUsers)

router.get('/report',authMiddleware.handleToken, adminCtrl.getReport)


router.get('/cron-job', adminCtrl.cronJob)

module.exports = router