const express = require('express')
const router = express.Router()
const userCtrl = require('../controllers/user')
const authMiddleware = require('../middlewares/auth')

router.post('/signup', userCtrl.signup)

router.post('/login', userCtrl.login)

router.post('/jobscount', userCtrl.jobsCount)

router.post('/companyjobs', userCtrl.companyjobs)

router.get('/switch-api', authMiddleware.handleToken, userCtrl.switchAccount)

router.put('/profile/:id', authMiddleware.handleToken, userCtrl.updateUserProfile)

router.get('/profile/:id', authMiddleware.handleToken, userCtrl.getUserProfile)

router.get('/email-verify/otp', userCtrl.sendEmailOTP)

router.get('/email-verify', userCtrl.verifyEmailOTP)

router.get('/recovery-verify', authMiddleware.handleToken, userCtrl.recoveryVerify)

router.get('/forgot-password/otp', userCtrl.sendForgotPasswordOTP)

router.put('/forgot-password', userCtrl.forgotPassword)

router.get('/check', userCtrl.checkUser)

router.put('/:id/password/change', authMiddleware.handleToken, userCtrl.changePassword)

router.get('/:id/salary', authMiddleware.handleToken, userCtrl.getSalary)

router.post('/search/profile', authMiddleware.handleToken, userCtrl.trackUserProfileVisit)

router.post('/search', authMiddleware.handleToken, userCtrl.searchUsers)

router.post('/search/map', authMiddleware.handleToken, userCtrl.searchUsersForMap)

router.get('/search/recent', authMiddleware.handleToken, userCtrl.getRecentSearch)

router.get('/search/recent-ind',authMiddleware.handleToken, userCtrl.getRecentSearchInd)

router.get('/search/popular',authMiddleware.handleToken, userCtrl.getPopularSearch)

router.get('/search/popular-text',authMiddleware.handleToken, userCtrl.getPopularSearchText)

router.get('/get-users', authMiddleware.handleToken, userCtrl.getUsers);

router.get('/get-user-by-id', userCtrl.getUserByID);

router.post('/activation-toggle',authMiddleware.handleToken, userCtrl.deactivateAccount);

router.put('/update-email', authMiddleware.handleToken, userCtrl.updateEmail);


router.post('/get-user-data', authMiddleware.handleToken, userCtrl.getUserData);

router.post('/resume-parser', userCtrl.getresumeData);

router.post('/download-pdf', authMiddleware.handleToken, userCtrl.downloadPdf);


router.get('/getUserJobDetails', authMiddleware.handleToken, userCtrl.getUserJobDetails);

router.post('/addUserJobDetails', authMiddleware.handleToken, userCtrl.addUserJobDetails);

router.put('/updateUserJobDetails', authMiddleware.handleToken, userCtrl.updateUserJobDetails);


router.get('/getJobTypes', authMiddleware.handleToken, userCtrl.getJobTypes);
router.post('/send-invite', authMiddleware.handleToken, userCtrl.sendInviteMail);

module.exports = router
