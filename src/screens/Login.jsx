import { useState } from 'react';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase.js';
import Icon from '../components/Icon.jsx';

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    // Browsers that block popups (some mobile) fall back to redirect sign-in
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
    throw e;
  }
}

export default function Login() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e.code === 'auth/unauthorized-domain'
        ? 'This domain is not authorized in Firebase. Add it under Authentication > Settings > Authorized domains.'
        : 'Sign-in failed. Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen login">
      <div className="login-top">
        <div className="app-mark" aria-hidden="true">
          <Icon name="calendar" size={28} />
        </div>
        <div className="stack-8">
          <h1 className="display">Planner</h1>
          <p className="muted lead">Manage your tasks and schedule by day, all in one place.</p>
        </div>
      </div>

      <div className="stack-14">
        {error && <p className="error-text" role="alert">{error}</p>}
        <button type="button" className="btn google" onClick={login} disabled={busy}>
          <span className="g-mark" aria-hidden="true">G</span>
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </button>
        <p className="hint">
          <Icon name="lock" size={14} stroke={2.2} />
          Only approved emails can access this planner
        </p>
      </div>
    </div>
  );
}
