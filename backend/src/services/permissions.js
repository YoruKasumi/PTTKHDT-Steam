'use strict';

const PERMISSIONS = [
  { code: 'game.approve', label: 'Phê duyệt game' },
  { code: 'game.delist', label: 'Gỡ game khỏi cửa hàng' },
  { code: 'finance.read', label: 'Xem báo cáo tài chính' },
  { code: 'review.moderate', label: 'Kiểm duyệt đánh giá' },
  { code: 'community.moderate', label: 'Kiểm duyệt nội dung cộng đồng' },
  { code: 'account.moderate', label: 'Quản lý trạng thái tài khoản' },
  { code: 'staff.manage', label: 'Quản lý nhân sự' },
  { code: 'roles.manage', label: 'Quản lý vai trò' },
  { code: 'genres.manage', label: 'Quản lý thể loại' },
  { code: 'banners.manage', label: 'Quản lý banner' },
  { code: 'system-config.manage', label: 'Cấu hình hệ thống' },
  { code: 'audit.read', label: 'Xem nhật ký quản trị' },
];

module.exports = { PERMISSIONS, permissionCodes: new Set(PERMISSIONS.map(({ code }) => code)) };
