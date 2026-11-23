const managerLandingPages = [
  ['account.moderate', '/admin/accounts'],
  ['game.approve', '/admin/games'],
  ['review.moderate', '/admin/reviews'],
  ['community.moderate', '/moderation/community'],
  ['finance.read', '/finance/overview'],
  ['genres.manage', '/admin/genres-banners'],
  ['banners.manage', '/admin/genres-banners'],
];

export function getRoleLandingPath(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

  if (roles.includes('Admin')) return '/admin/accounts';
  if (roles.includes('Developer')) return '/developer/games';
  if (roles.includes('Manager')) {
    const page = managerLandingPages.find(([permission]) => permissions.includes(permission));
    return page?.[1] || '/profile';
  }
  return '/';
}
