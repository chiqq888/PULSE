import { Outlet } from 'react-router-dom';
import { AccountActions } from '../components/AccountActions';
import { BrandLogo } from '../components/BrandLogo';
import { PrimaryNav } from '../components/PrimaryNav';

const USER_NAV_ITEMS = [
  { to: '/user', label: 'Explore', end: true },
  { to: '/user/my-events', label: 'My Events' },
];

export function UserLayout() {
  return (
    <div className="app-shell app-shell--user">
      <header className="site-header">
        <div className="container site-header__inner">
          <div className="site-header__brand-row">
            <BrandLogo to="/" role="user" roleLabel="User" />
            <PrimaryNav items={USER_NAV_ITEMS} ariaLabel="เมนูผู้ใช้" />
          </div>

          <AccountActions />
        </div>
      </header>

      <main className="site-main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <span>PULSE - ระบบลงทะเบียนอีเวนต์และคอนเสิร์ตฟรี พร้อมบัตร QR และการเช็กอิน</span>
          <span className="site-footer__copy">© 2026 PULSE by chiqq888. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
