'use strict';
const express = require('express');

const router = express.Router();

const modules = [
  { prefix: '/auth', tag: 'Authentication', router: require('./auth.routes') },
  { prefix: '/admin', tag: 'Administration', router: require('./admin.routes') },
  { prefix: '/genres', tag: 'Genres', router: require('./genres.public.routes') },
  { prefix: '/banners', tag: 'Banners', router: require('./banners.public.routes') },
  { prefix: '/profile', tag: 'Profile', router: require('./profile.routes') },
  { prefix: '/catalog', tag: 'Catalog', router: require('./catalog.routes') },
  { prefix: '/cart', tag: 'Cart', router: require('./cart.routes') },
  { prefix: '/game', tag: 'Games', router: require('./game.routes') },
  { prefix: '/wishlist', tag: 'Wishlist', router: require('./wishlist.routes') },
  { prefix: '/wallet', tag: 'Wallet', router: require('./wallet.routes') },
  { prefix: '/order', tag: 'Orders', router: require('./order.routes') },
  { prefix: '/orders', tag: 'Orders', router: require('./orders.routes') },
  { prefix: '/library', tag: 'Library', router: require('./library.routes') },
  { prefix: '/notification', tag: 'Notifications', router: require('./notification.routes') },
  { prefix: '/developer', tag: 'Developer', router: require('./developer.routes') },
  { prefix: '/promotion', tag: 'Promotions', router: require('./promotion.routes') },
  { prefix: '/report', tag: 'Reports', router: require('./report.routes') },
  { prefix: '/withdrawal', tag: 'Withdrawals', router: require('./withdrawal.routes') },
  { prefix: '/moderation', tag: 'Moderation', router: require('./moderation.routes') },
  { prefix: '/audit-log', tag: 'Audit logs', router: require('./audit-log.routes') },
  { prefix: '/account', tag: 'Accounts', router: require('./account.routes') },
  { prefix: '/genre', tag: 'Genres', router: require('./genre.routes') },
  { prefix: '/banner', tag: 'Banners', router: require('./banner.routes') },
  { prefix: '/finance', tag: 'Finance', router: require('./finance.routes') },
  { prefix: '/system-config', tag: 'System configuration', router: require('./system-config.routes') },
  { prefix: '/rbac', tag: 'RBAC', router: require('./rbac.routes') },
  { prefix: '/staff', tag: 'Staff', router: require('./staff.routes') },
];

modules.forEach(({ prefix, router: moduleRouter }) => router.use(prefix, moduleRouter));
router.apiModules = modules;

module.exports = router;
