// Login.jsx – Redesigned login page matching the reference UI layout exactly (pink theme)

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { confirmAction, showSuccessToast, showAlert } from '../utils/swalHelper';

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showAlert({ title: 'Login Failed', text: result.error, icon: 'error' });
    } else {
      showSuccessToast('Welcome back!');
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-container">

        {/* ── Left: Brand panel ── */}
        <div className="login-brand">
          {/* 3D gradient spheres matching the reference mockup layout */}
          <div className="lbc-sphere-1" />
          <div className="lbc-sphere-2" />
          <div className="lbc-sphere-3" />

          <div className="login-brand-content">
            <h1 className="lb-welcome">WELCOME</h1>
            <h2 className="lb-headline">INVENTORY MANAGEMENT SYSTEM</h2>
            <p className="lb-desc">
              "Empower your business with real-time insights. Streamline your stock, optimize your workflow, and take full control of your inventory."
            </p>
          </div>
        </div>

        {/* ── Right: Form panel ── */}
        <div className="login-form-panel">
          {/* Decorative sphere in bottom right corner */}
          <div className="lf-corner-sphere" />

          <div className={`login-form-box ${shake ? 'shake' : ''}`}>
            <h2 className="lf-title">Sign In</h2>
            <p className="lf-sub">Welcome back! Please enter your credentials to continue.</p>

            <form onSubmit={handleSubmit} autoComplete="off" style={{ marginTop: 28 }}>

              {/* User Name Input */}
              <div className="login-field">
                <div className="login-input-wrap">
                  <span className="login-input-icon"><IconUser /></span>
                  <input
                    id="login-username"
                    type="text"
                    placeholder="User name"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="login-field">
                <div className="login-input-wrap">
                  <span className="login-input-icon"><IconLock /></span>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="login-eye" onClick={() => setShowPass(v => !v)}>
                    {showPass ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {/* Remember me checkbox + Forgot password link */}
              <div className="lf-row">
                <label className="lf-remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <span>Remember me</span>
                </label>
                <span
                  className="lf-forgot"
                  onClick={async () => {
                    const confirm = await confirmAction({
                      title: 'Autofill Credentials',
                      text: 'Do you want to autofill the form with Administrator credentials?',
                      icon: 'question',
                      confirmText: 'Yes, Autofill',
                      cancelText: 'Cancel'
                    });
                    if (confirm) {
                      setUsername('admin');
                      setPassword('admin123');
                      showSuccessToast('Demo credentials autofilled');
                    }
                  }}
                >
                  Forgot Password?
                </span>
              </div>

              {error && (
                <div className="login-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <span>{error}</span>
                </div>
              )}

              {/* sing in submit button */}
              <button id="login-submit-btn" type="submit" className="login-btn" disabled={loading}>
                {loading ? <span className="login-spinner" /> : 'Sign In'}
              </button>


            </form>

            {/* Footer */}
            <p className="lf-footer">
              Don't have an account? <span className="lf-signup">Sign Up</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}