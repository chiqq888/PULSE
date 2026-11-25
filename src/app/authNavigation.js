export function accountHome(role) {
  if (role === 'organizer') return '/org';
  if (role === 'staff') return '/staff';
  return '/user';
}

export function afterAuthentication(from, role) {
  const pathname = from?.pathname;
  if (typeof pathname !== 'string') return accountHome(role);

  if (pathname === '/user' || pathname.startsWith('/user/')) {
    return { pathname, search: from.search, hash: from.hash };
  }

  const home = accountHome(role);
  if (pathname === home || pathname.startsWith(`${home}/`)) {
    return { pathname, search: from.search, hash: from.hash };
  }

  return home;
}
