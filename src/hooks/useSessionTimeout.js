// useSessionTimeout.js
// Auto-logout hook: warns user 1 minute before timeout, then logs out.

import { useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';

const SESSION_TIMEOUT_MS  = 15 * 60 * 1000; // 15 minutes of inactivity
const WARNING_BEFORE_MS   =  1 * 60 * 1000; // Show warning 1 minute before logout

export function useSessionTimeout(logout) {
  const logoutTimerRef  = useRef(null);
  const warningTimerRef = useRef(null);
  const warningSwalRef  = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(logoutTimerRef.current);
    clearTimeout(warningTimerRef.current);
  }, []);

  const doLogout = useCallback(() => {
    clearTimers();
    if (warningSwalRef.current) {
      Swal.close();
      warningSwalRef.current = null;
    }
    logout();
    Swal.fire({
      title: 'Session Expired',
      text: 'You were automatically logged out due to inactivity.',
      icon: 'info',
      confirmButtonText: 'Log In Again',
      allowOutsideClick: false,
    });
  }, [logout, clearTimers]);

  const showWarning = useCallback(() => {
    warningSwalRef.current = Swal.fire({
      title: '⚠️ Session Timeout Warning',
      html: `
        <div style="font-family:'Poppins',sans-serif;font-size:0.85rem;color:var(--text-secondary);">
          <p>Your session will expire in <strong>1 minute</strong> due to inactivity.</p>
          <p style="margin-top:8px;">Click <strong>"Stay Logged In"</strong> to continue your session.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Stay Logged In',
      cancelButtonText: 'Logout Now',
      allowOutsideClick: false,
      timer: WARNING_BEFORE_MS,
      timerProgressBar: true,
    });

    warningSwalRef.current.then((result) => {
      warningSwalRef.current = null;
      if (result.isConfirmed) {
        resetTimers(); // User chose to stay — reset inactivity timers
      } else {
        doLogout();   // User clicked "Logout Now" or timer expired
      }
    });
  }, [doLogout]);

  const resetTimers = useCallback(() => {
    clearTimers();
    // Close any existing warning if user resumed activity
    if (warningSwalRef.current) {
      Swal.close();
      warningSwalRef.current = null;
    }
    warningTimerRef.current = setTimeout(showWarning, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);
    logoutTimerRef.current  = setTimeout(doLogout,   SESSION_TIMEOUT_MS);
  }, [clearTimers, showWarning, doLogout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];

    const handleActivity = () => {
      // Only reset if no warning is showing
      if (!warningSwalRef.current) {
        resetTimers();
      }
    };

    events.forEach(e => window.addEventListener(e, handleActivity));
    resetTimers(); // Start the initial timers

    return () => {
      clearTimers();
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [resetTimers, clearTimers]);
}
