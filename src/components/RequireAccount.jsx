import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { accountHome } from '../app/authNavigation';
import { useAuth } from '../context/AuthContext';
import { AccountActions } from './AccountActions';
import { FeedbackState } from './FeedbackState';

export function RequireAccount({ role: requiredRole }) {
  const { user, role, loading, error, retryProfile } = useAuth();
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

  if (requiredRole && role !== requiredRole) {
    return (
      <section className="auth-boundary card page-stack-sm">
        <h1>บัญชีนี้ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-muted">
          {requiredRole === 'organizer' ? 'หน้านี้สำหรับผู้จัดงาน' : 'หน้านี้สำหรับเจ้าหน้าที่เช็กอิน'}
        </p>
        <div className="page-header__actions">
          <Link className="btn btn--primary" to={accountHome(role)}>กลับไปหน้าหลัก</Link>
          <AccountActions />
        </div>
      </section>
    );
  }

  return <Outlet />;
}
