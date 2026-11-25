import { Outlet } from 'react-router-dom';
import { AccountActions } from '../components/AccountActions';
import { BrandLogo } from '../components/BrandLogo';
import { PrimaryNav } from '../components/PrimaryNav';

const ORG_NAV_ITEMS = [
  { to: '/org', label: 'Dashboard', end: true },
  { to: '/org/events', label: 'รายการงานทั้งหมด', end: true },
  { to: '/org/events/new', label: '+ สร้างงานใหม่' },
];

export function OrganizerLayout() {
  return (
    <div className="app-shell app-shell--org">
      <header className="site-header site-header--org">
        <div className="container site-header__inner">
          <div className="site-header__brand-row">
            <BrandLogo to="/org" role="org" roleLabel="Organizer" />
            <PrimaryNav items={ORG_NAV_ITEMS} ariaLabel="เมนูผู้จัดงาน" />
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
          <span>PULSE Organizer Portal - จัดการงาน ผังที่นั่ง ผู้ลงทะเบียน และ Dashboard</span>
          <span className="site-footer__copy">© 2026 PULSE by chiqq888. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
