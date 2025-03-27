const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Import controllers
const forumController = require('../controllers/forumController');
const chatController = require('../controllers/chatController');
const dashboardController = require('../controllers/dashboardController');
const friendRoutes = require('./friendRoutes');
const messageRequestRoutes = require('./messageRequestRoutes');
const upload = require('../middleware/upload');
const { uploadProfilePicture } = require('../controllers/userController');

// Forum routes
router.post('/forum/posts', auth, forumController.createPost);
router.get('/forum/posts', auth, forumController.getPosts);
router.get('/forum/posts/:postId', auth, forumController.getPost);
router.post('/forum/posts/:postId/comments', auth, forumController.addComment);
router.post('/forum/posts/:postId/like', auth, forumController.toggleLike);

// Chat routes
router.post('/chat/private', auth, chatController.createOrGetPrivateChat);
router.post('/chat/group', auth, chatController.createGroupChat);
router.post('/chat/upload', auth, upload.single('media'), chatController.uploadMedia);
router.post('/chat/:chatId/messages', auth, chatController.sendMessage);
router.get('/chat/messages/:chatId', auth, chatController.getChatMessages);
router.get('/chat/:chatId', auth, chatController.getChatById);
router.get('/chat', auth, chatController.getUserChats);

// Dashboard routes
router.post('/dashboard', auth, dashboardController.createOrUpdateDashboard);
router.get('/dashboard', auth, dashboardController.getDashboard);
router.post('/dashboard/weather-alerts', auth, roleAuth('admin'), dashboardController.addWeatherAlert);
router.post('/dashboard/crop-prices', auth, roleAuth('admin'), dashboardController.updateCropPrices);
router.post('/dashboard/farming-tips', auth, roleAuth('expert'), dashboardController.addFarmingTip);

// Friend routes
router.use('/users', friendRoutes);

// Message request routes
router.use('/users', messageRequestRoutes);

module.exports = router;