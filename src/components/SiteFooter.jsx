export function SiteFooter({ role = '' }) {
  const label = role ? `PULSE ${role}` : 'PULSE';

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <span>{label} - ระบบลงทะเบียนอีเวนต์และคอนเสิร์ตฟรี</span>
        <span className="site-footer__copy">© 2026 PULSE by chiqq888. All rights reserved.</span>
      </div>
    </footer>
  );
}
