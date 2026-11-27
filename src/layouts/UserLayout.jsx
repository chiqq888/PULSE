import { Outlet, useLocation } from 'react-router-dom';
import { AccountActions } from '../components/AccountActions';
import { BrandLogo } from '../components/BrandLogo';
import { PrimaryNav } from '../components/PrimaryNav';
import { SiteFooter } from '../components/SiteFooter';

const USER_NAV_ITEMS = [
  { to: '/user', label: 'Explore', end: true },
  { to: '/user/my-events', label: 'My Events' },
];

export function UserLayout() {
  const location = useLocation();
  const isEmbed = new URLSearchParams(location.search).get('embed') === '1';

  const handleEmbedClickCapture = (event) => {
    if (!isEmbed) return;
    if (event.target instanceof Element && event.target.closest('a[href]')) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div
      className={`app-shell app-shell--user${
        isEmbed ? ' app-shell--embed app-shell--embed-center' : ''
      }`}
      onClickCapture={isEmbed ? handleEmbedClickCapture : undefined}
    >
      {!isEmbed && (
        <header className="site-header">
          <div className="container site-header__inner">
            <div className="site-header__brand-row">
              <BrandLogo to="/" role="user" roleLabel="User" />
              <PrimaryNav items={USER_NAV_ITEMS} ariaLabel="เมนูผู้ใช้" />
            </div>

            <AccountActions />
          </div>
        </header>
      )}

      <main className="site-main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      {!isEmbed && <SiteFooter role="User" />}
    </div>
  );
}
