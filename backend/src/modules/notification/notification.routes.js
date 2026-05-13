const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const notificationService = require('./notification.service');
const Notification = require('./notification.model');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.user._id, req.query);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.put('/read', async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.user._id, req.body.ids || 'all');
    res.json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) { next(error); }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, data: { count } });
  } catch (error) { next(error); }
});

module.exports = router;
