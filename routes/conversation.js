const express = require('express');
const router = express.Router();
const conversationCtrl = require('../controllers/conversation');
const authMiddleware = require('../middlewares/auth');


router.post('/create-conversation', authMiddleware.handleToken, conversationCtrl.createConversation);

router.get('/get-conversations', authMiddleware.handleToken, conversationCtrl.getConversations);


router.post('/add-message', authMiddleware.handleToken, conversationCtrl.addMessage);


router.get('/get-messages', authMiddleware.handleToken, conversationCtrl.getMessages);

router.get('/get-unreadMessages', authMiddleware.handleToken, conversationCtrl.getUnreadMessages);

module.exports = router;