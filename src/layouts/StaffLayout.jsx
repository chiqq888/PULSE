import { Outlet } from 'react-router-dom';
import { AccountActions } from '../components/AccountActions';
import { BrandLogo } from '../components/BrandLogo';
import { PrimaryNav } from '../components/PrimaryNav';
import { SiteFooter } from '../components/SiteFooter';

const STAFF_NAV_ITEMS = [
  { to: '/staff', label: 'รายการงานเช็กอิน', end: true },
  { to: '/staff/check-in', label: 'สแกน / ตรวจบัตร' },
];

export function StaffLayout() {
  return (
    <div className="app-shell app-shell--staff">
      <header className="site-header site-header--staff">
        <div className="container site-header__inner">
          <div className="site-header__brand-row">
            <BrandLogo to="/staff" role="staff" roleLabel="Staff" />
            <PrimaryNav items={STAFF_NAV_ITEMS} ariaLabel="เมนูเจ้าหน้าที่เช็กอิน" />
          </div>

          <AccountActions />
        </div>
      </header>

      <main className="site-main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <SiteFooter role="Staff" />
    </div>
  );
}
