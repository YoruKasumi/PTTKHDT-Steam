'use strict';
const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/catalog', require('./catalog.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/game', require('./game.routes'));
router.use('/wishlist', require('./wishlist.routes'));
router.use('/wallet', require('./wallet.routes'));
router.use('/order', require('./order.routes'));
router.use('/library', require('./library.routes'));
router.use('/notification', require('./notification.routes'));
router.use('/developer', require('./developer.routes'));
router.use('/promotion', require('./promotion.routes'));
router.use('/report', require('./report.routes'));
router.use('/withdrawal', require('./withdrawal.routes'));
router.use('/moderation', require('./moderation.routes'));
router.use('/audit-log', require('./audit-log.routes'));
router.use('/account', require('./account.routes'));
router.use('/genre', require('./genre.routes'));
router.use('/banner', require('./banner.routes'));
router.use('/finance', require('./finance.routes'));
router.use('/system-config', require('./system-config.routes'));
router.use('/rbac', require('./rbac.routes'));
router.use('/staff', require('./staff.routes'));

module.exports = router;
