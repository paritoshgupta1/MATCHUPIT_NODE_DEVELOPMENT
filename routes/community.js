const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth');

const communityCtrl = require('../controllers/community');

router.post('/create-community', authMiddleware.handleToken, communityCtrl.createCommunity)

router.post('/join-community', authMiddleware.handleToken, communityCtrl.joinCommunity)

router.post('/add-post', authMiddleware.handleToken, communityCtrl.addPost)

router.post('/add-comment', authMiddleware.handleToken, communityCtrl.addComment)


router.get('/get-posts', authMiddleware.handleToken, communityCtrl.getPosts)

router.post('/edit-community', authMiddleware.handleToken, communityCtrl.editCommunity)

router.post('/add-react-to-post', authMiddleware.handleToken, communityCtrl.addReactToPost)

// router.post('/add-dislike-to-post', authMiddleware.handleToken, communityCtrl.addDislikeToPost)

// router.post('/add-applaud-to-post', authMiddleware.handleToken, communityCtrl.addApplaudToPost)


router.get('/get-communities', authMiddleware.handleToken, communityCtrl.getCommunities)

router.post('/toggle-community', authMiddleware.handleToken, communityCtrl.toggleCommunity)


router.post('/leave-community', authMiddleware.handleToken, communityCtrl.leaveCommunity)

router.post('/delete-community1', authMiddleware.handleToken, communityCtrl.deleteCommunity1)

router.post('/delete-post', authMiddleware.handleToken, communityCtrl.deletePost)


router.post('/edit-post', authMiddleware.handleToken, communityCtrl.editPost)


router.post('/add-react-to-comment', authMiddleware.handleToken, communityCtrl.addReactToComment)

router.post('/is-community-exists', authMiddleware.handleToken, communityCtrl.isCommunityExists)

router.get('/get-my-communities', authMiddleware.handleToken, communityCtrl.getMyCommunities)

router.get('/get-top-communities',authMiddleware.handleToken, communityCtrl.getTopCommunities)

router.post('/search-communities',authMiddleware.handleToken,communityCtrl.searchCommunities)

module.exports = router;