const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth');
const corporateCtrl = require('../controllers/corporate');




router.post('/search-corporate', authMiddleware.handleToken, corporateCtrl.searchCorporates)

router.post('/search-corporate/profile',authMiddleware.handleToken, corporateCtrl.trackProfileVisit)

router.post('/jobpost',authMiddleware.handleToken, corporateCtrl.postjobs)

router.post('/search-corporate/map', authMiddleware.handleToken, corporateCtrl.searchCorporatesForMap)

router.get('/search-corporate/recent',authMiddleware.handleToken, corporateCtrl.getRecentSearch)

router.get('/search-corporate/popular-text',authMiddleware.handleToken, corporateCtrl.getPopularText)

router.get('/search-corporate/recent-profile',authMiddleware.handleToken, corporateCtrl.getRecentProfile)

router.get('/search-corporate/popular-profile',authMiddleware.handleToken, corporateCtrl.getPopularProfile)

router.post('/tag-user', authMiddleware.handleToken, corporateCtrl.tagUser)


router.post('/add-corporate-member', authMiddleware.handleToken, corporateCtrl.addCorporateMember)


router.post('/remove-corporate-member', authMiddleware.handleToken, corporateCtrl.removeCorporateMember)



router.get('/get-tagged-users', authMiddleware.handleToken, corporateCtrl.getTaggedUsers)





module.exports = router;