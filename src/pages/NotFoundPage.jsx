import { Link } from 'react-router-dom';
import { AccountActions } from '../components/AccountActions';
import { BrandLogo } from '../components/BrandLogo';

export function NotFoundPage() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <BrandLogo to="/" />
          <AccountActions />
        </div>
      </header>

      <main className="site-main">
        <div className="container">
          <section className="not-found-card card">
            <span className="not-found-card__code">404</span>
            <h1>ไม่พบหน้าที่คุณกำลังค้นหา</h1>
            <p className="text-muted">
              เส้นทาง URL นี้อาจพิมพ์ไม่ถูกต้อง หรือรายการดังกล่าวไม่มีอยู่ในระบบ
            </p>
            <div className="not-found-card__actions">
              <Link to="/" className="btn btn--secondary">
                กลับหน้าแรก
              </Link>
              <Link to="/user" className="btn btn--primary">
                สำรวจงาน
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
