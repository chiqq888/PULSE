import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { accountHome } from '../app/authNavigation';
import { useAuth } from '../context/AuthContext';

export function AccountActions() {
  const { user, role, loading, signOut } = useAuth();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const home = accountHome(role);
  const inWorkspace = location.pathname === home || location.pathname.startsWith(`${home}/`);

  async function handleSignOut() {
    setBusy(true);
    setError('');
    try {
      await signOut();
    } catch {
      setError('ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  if (!user && loading) return null;

  if (!user) {
    return (
      <div className="account-actions">
        <Link className="btn btn--ghost btn--sm" to="/login">เข้าสู่ระบบ</Link>
        <Link className="btn btn--primary btn--sm" to="/register">สมัครสมาชิก</Link>
      </div>
    );
  }

  return (
    <div className="account-actions">
      {role === 'organizer' && !inWorkspace && (
        <Link className="link-inline" to={home}>จัดการงาน</Link>
      )}
      {role === 'staff' && !inWorkspace && (
        <Link className="link-inline" to={home}>เช็กอิน</Link>
      )}
      {home !== '/user' && inWorkspace && (
        <Link className="link-inline" to="/user">สำรวจงาน</Link>
      )}
      <span className="account-actions__identity" title={user.email}>
        {user.user_metadata?.full_name || user.email}
      </span>
      <button
        className="btn btn--secondary btn--sm"
        type="button"
        onClick={handleSignOut}
        disabled={busy}
      >
        {busy ? 'กำลังออกจากระบบ…' : 'ออกจากระบบ'}
      </button>
      {error && <p className="account-actions__error field-error" role="alert">{error}</p>}
    </div>
  );
}
