import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { afterAuthentication } from '../app/authNavigation';
import { AccountActions } from '../components/AccountActions';
import { BrandLogo } from '../components/BrandLogo';
import { FeedbackState } from '../components/FeedbackState';
import { useAuth } from '../context/AuthContext';
import { supabase, supabaseSetupMessage } from '../services/supabaseClient';

const authErrors = {
  email_not_confirmed: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
  invalid_credentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  email_address_invalid: 'กรุณากรอกอีเมลที่ใช้งานได้',
  email_address_not_authorized: 'ระบบส่งอีเมลยืนยันไปยังที่อยู่นี้ไม่ได้',
  weak_password: 'รหัสผ่านไม่ตรงตามข้อกำหนดของระบบ กรุณาเลือกรหัสผ่านใหม่',
  user_already_exists: 'อีเมลนี้สมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบ',
  email_exists: 'อีเมลนี้สมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบ',
  over_email_send_rate_limit: 'ระบบส่งอีเมลถึงขีดจำกัดชั่วคราว กรุณาลองใหม่ภายหลัง',
  over_request_rate_limit: 'มีคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่',
};

function confirmationError(location) {
  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.slice(1));
  const code = query.get('error_code') || hash.get('error_code');
  if (!code) return '';
  return code === 'otp_expired'
    ? 'ลิงก์ยืนยันอีเมลหมดอายุหรือใช้ไปแล้ว'
    : 'ยืนยันอีเมลไม่สำเร็จ กรุณาตรวจสอบลิงก์แล้วลองอีกครั้ง';
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.56-5.15 3.56-8.65Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28V6.63H1.28a12 12 0 0 0 0 10.74l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.63l4 3.09C6.23 6.87 8.88 4.76 12 4.76Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path
        fill="#ffffff"
        d="M13.53 20.9V13.8h2.38l.36-2.77h-2.74V9.26c0-.8.22-1.35 1.37-1.35h1.47V5.43c-.25-.03-1.13-.11-2.14-.11-2.12 0-3.57 1.29-3.57 3.67v2.04H8.26v2.77h2.4v7.1a11.1 11.1 0 0 0 2.87 0Z"
      />
    </svg>
  );
}

function SocialAuthRow({ disabled, onSelect }) {
  return (
    <div className="auth-social-row">
      <button
        type="button"
        className="auth-social-btn"
        disabled={disabled}
        onClick={() => onSelect('Google')}
        aria-label="ดำเนินการต่อด้วย Google"
      >
        <GoogleIcon />
        <span>ต่อด้วย Google</span>
      </button>
      <button
        type="button"
        className="auth-social-btn"
        disabled={disabled}
        onClick={() => onSelect('Facebook')}
        aria-label="ดำเนินการต่อด้วย Facebook"
      >
        <FacebookIcon />
        <span>ต่อด้วย Facebook</span>
      </button>
    </div>
  );
}

function AuthTermsNote() {
  return (
    <p className="auth-terms">
      เมื่อกดดำเนินการต่อ ถือว่าคุณยอมรับ
      <br />
      <span className="auth-terms__highlight">ข้อกำหนดการใช้งาน</span> และ{' '}
      <span className="auth-terms__highlight">นโยบายความเป็นส่วนตัว</span>
    </p>
  );
}

export function AuthPage({ register = false }) {
  const { user, role, canAccessStaff, loading, error: profileError, retryProfile, signIn, signUp } = useAuth();
  const location = useLocation();
  const from = location.state?.from;
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState(() => confirmationError(location));
  const [socialNotice, setSocialNotice] = useState('');
  const title = register ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';

  function handleSocialClick(provider) {
    setError('');
    setSocialNotice(
      `การ${title}ด้วย ${provider} ยังไม่เปิดใช้งานในขณะนี้ กรุณาใช้อีเมลและรหัสผ่าน`
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy || !supabase) return;

    const form = new FormData(event.currentTarget);
    const email = (form.get('email') || '').toString().trim();
    const password = (form.get('password') || '').toString();
    setError('');
    setSocialNotice('');

    let fullName = '';
    if (register) {
      const firstName = (form.get('firstName') || '').toString().trim();
      const lastName = (form.get('lastName') || '').toString().trim();
      if (!firstName || !lastName) {
        setError('กรุณากรอกชื่อและนามสกุล');
        return;
      }
      fullName = `${firstName} ${lastName}`.trim();

      if (password !== form.get('confirmPassword')) {
        setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
        return;
      }
    }

    setBusy(true);
    try {
      if (register) {
        const session = await signUp({
          email,
          password,
          fullName,
          emailRedirectTo: new URL('/login', window.location.origin).href,
        });
        if (!session) setSentTo(email);
      } else {
        await signIn(email, password);
      }
    } catch (authError) {
      setError(authErrors[authError.code] || `${title}ไม่สำเร็จ กรุณาลองอีกครั้ง`);
    } finally {
      setBusy(false);
    }
  }

  if (user && !loading && !profileError) {
    return <Navigate to={afterAuthentication(from, role, canAccessStaff)} replace />;
  }

  return (
    <div className={`auth-page ${register ? 'auth-page--register' : 'auth-page--login'}`}>
      <header className="auth-header">
        <div className="container auth-header__inner">
          <BrandLogo to="/" />
          <p className="auth-tagline">
            <span>ออกแบบเพื่อ</span>
            <span className="auth-tagline__accent">ทุกจังหวะอีเวนต์</span>
          </p>
        </div>
      </header>

      <main className="container auth-stage">
        <section
          className={`auth-panel ${register ? 'auth-panel--plain' : 'auth-panel--card'}`}
          aria-labelledby="auth-title"
        >
          <h1 id="auth-title" className="auth-heading">
            {sentTo ? (
              'ตรวจสอบอีเมลของคุณ'
            ) : (
              <>
                <span>{title}</span>{' '}
                <span className="auth-heading__accent">PULSE</span>
              </>
            )}
          </h1>

          {loading ? (
            <FeedbackState type="loading" title="กำลังตรวจสอบบัญชี…" compact />
          ) : profileError ? (
            <div className="auth-profile-error">
              <FeedbackState type="error" title={profileError} onAction={retryProfile} compact />
              <AccountActions />
            </div>
          ) : sentTo ? (
            <div className="auth-sent">
              <p className="text-muted">
                หากอีเมล <strong>{sentTo}</strong> ใช้สมัครได้ คุณจะได้รับลิงก์ยืนยันจาก PULSE
                กรุณาเปิดลิงก์ในอีเมลเพื่อยืนยันบัญชี
              </p>
              <Link className="auth-submit" to="/login" state={{ from }}>
                ไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          ) : register ? (
            <>
              <SocialAuthRow disabled={busy} onSelect={handleSocialClick} />
              <div className="auth-divider">
                <span>หรือ</span>
              </div>

              {!supabase && (
                <p className="alert alert--warning auth-alert" role="status">
                  {supabaseSetupMessage}
                </p>
              )}
              {error && (
                <p className="alert alert--danger auth-alert" role="alert">
                  {error}
                </p>
              )}
              {socialNotice && (
                <p className="alert alert--info auth-alert" role="status">
                  {socialNotice}
                </p>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>
                <fieldset disabled={busy || !supabase}>
                  <div className="auth-row-2">
                    <div className="auth-field">
                      <div className="auth-field__head">
                        <label className="auth-label" htmlFor="auth-first-name">
                          ชื่อ
                        </label>
                      </div>
                      <input
                        className="auth-input"
                        id="auth-first-name"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        maxLength={59}
                        placeholder="ชื่อ"
                        required
                      />
                    </div>
                    <div className="auth-field">
                      <div className="auth-field__head">
                        <label className="auth-label" htmlFor="auth-last-name">
                          นามสกุล
                        </label>
                      </div>
                      <input
                        className="auth-input"
                        id="auth-last-name"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        maxLength={60}
                        placeholder="นามสกุล"
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <div className="auth-field__head">
                      <label className="auth-label" htmlFor="auth-email">
                        อีเมล
                      </label>
                    </div>
                    <input
                      className="auth-input"
                      id="auth-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="อีเมล"
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <div className="auth-field__head">
                      <label className="auth-label" htmlFor="auth-password">
                        รหัสผ่าน
                      </label>
                      <span className="auth-label-hint" id="auth-password-hint">
                        อย่างน้อย 8 ตัวอักษร
                      </span>
                    </div>
                    <input
                      className="auth-input"
                      id="auth-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      aria-describedby="auth-password-hint"
                      placeholder="รหัสผ่าน"
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <div className="auth-field__head">
                      <label className="auth-label" htmlFor="auth-confirm-password">
                        ยืนยันรหัสผ่าน
                      </label>
                    </div>
                    <input
                      className="auth-input"
                      id="auth-confirm-password"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      placeholder="ยืนยันรหัสผ่าน"
                      required
                    />
                  </div>

                  <AuthTermsNote />

                  <button className="auth-submit" type="submit">
                    {busy ? 'กำลังดำเนินการ…' : 'สมัครสมาชิก'}
                  </button>
                </fieldset>
              </form>

              <p className="auth-switch-text">
                มีบัญชีอยู่แล้ว?{' '}
                <Link className="auth-switch-pill__link" to="/login" state={{ from }}>
                  เข้าสู่ระบบที่นี่
                </Link>
              </p>
            </>
          ) : (
            <>
              {!supabase && (
                <p className="alert alert--warning auth-alert" role="status">
                  {supabaseSetupMessage}
                </p>
              )}
              {error && (
                <p className="alert alert--danger auth-alert" role="alert">
                  {error}
                </p>
              )}
              {socialNotice && (
                <p className="alert alert--info auth-alert" role="status">
                  {socialNotice}
                </p>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>
                <fieldset disabled={busy || !supabase}>
                  <div className="auth-field">
                    <label className="sr-only" htmlFor="auth-email">
                      อีเมล
                    </label>
                    <input
                      className="auth-input"
                      id="auth-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="กรอกอีเมลของคุณ"
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <label className="sr-only" htmlFor="auth-password">
                      รหัสผ่าน
                    </label>
                    <input
                      className="auth-input"
                      id="auth-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="กรอกรหัสผ่านของคุณ"
                      required
                    />
                  </div>

                  <AuthTermsNote />

                  <button className="auth-submit" type="submit">
                    {busy ? 'กำลังดำเนินการ…' : 'เข้าสู่ระบบ'}
                  </button>
                </fieldset>
              </form>

              <div className="auth-divider">
                <span>หรือ</span>
              </div>

              <SocialAuthRow disabled={busy} onSelect={handleSocialClick} />

              <p className="auth-switch-text">
                ยังไม่มีบัญชีใช่ไหม?{' '}
                <Link className="auth-switch-pill__link" to="/register" state={{ from }}>
                  สมัครสมาชิกที่นี่
                </Link>
              </p>
            </>
          )}
        </section>

        <Link className="auth-back-link" to="/user">
          กลับไปสำรวจงาน
        </Link>
      </main>
    </div>
  );
}
