import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { accountHome } from '../app/authNavigation';
import { useAuth } from '../context/AuthContext';
import { AccountActions } from './AccountActions';
import { FeedbackState } from './FeedbackState';

export function RequireAccount({ role: requiredRole }) {
  const { user, role, canAccessStaff, loading, error, retryProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FeedbackState type="loading" title="กำลังตรวจสอบบัญชี…" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (error && requiredRole) {
    return (
      <section className="auth-boundary">
        <FeedbackState type="error" title={error} onAction={retryProfile} />
        <AccountActions />
      </section>
    );
  }

  const hasAccess = requiredRole === 'staff' ? canAccessStaff : !requiredRole || role === requiredRole;
  if (!hasAccess) {
    return (
      <section className="auth-boundary card page-stack-sm">
        <h1>บัญชีนี้ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-muted">
          {requiredRole === 'organizer'
            ? 'หน้านี้สำหรับผู้จัดงาน'
            : 'ให้ผู้จัดงานเพิ่มอีเมลบัญชีของคุณเป็น Staff แล้วลองโหลดสิทธิ์อีกครั้ง'}
        </p>
        <div className="page-header__actions">
          {requiredRole === 'staff' && (
            <button type="button" className="btn btn--secondary" onClick={retryProfile}>
              โหลดสิทธิ์อีกครั้ง
            </button>
          )}
          <Link className="btn btn--primary" to={accountHome(role)}>กลับไปหน้าหลัก</Link>
          <AccountActions />
        </div>
      </section>
    );
  }

  return <Outlet />;
}
