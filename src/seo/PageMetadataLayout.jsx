import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { updatePageMetadata } from './head';
import { EXPLORE_METADATA, HOME_METADATA, NOINDEX_METADATA } from './metadata';

export function PageMetadataLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.replace(/\/+$/, '').toLowerCase();
    if (/^\/user\/events\/[^/]+$/.test(path)) return;

    if (!path) updatePageMetadata(HOME_METADATA);
    else if (path === '/user') updatePageMetadata(EXPLORE_METADATA);
    else updatePageMetadata(NOINDEX_METADATA);
  }, [pathname]);

  return <Outlet />;
}
