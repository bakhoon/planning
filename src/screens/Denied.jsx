import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import Icon from '../components/Icon.jsx';

const AUTO_LOGOUT_SECONDS = 8;

export default function Denied({ email }) {
  const [left, setLeft] = useState(AUTO_LOGOUT_SECONDS);

  useEffect(() => {
    if (left <= 0) {
      signOut(auth);
      return undefined;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  return (
    <div className="screen login">
      <div className="login-top">
        <div className="app-mark danger" aria-hidden="true">
          <Icon name="lock" size={28} />
        </div>
        <div className="stack-8">
          <h1 className="title">Access denied</h1>
          <p className="muted">
            This planner is only available to approved emails. You will be signed out in {left}s.
          </p>
        </div>
        <div className="card info-card">
          <span className="label-sm">Signed in as</span>
          <span className="strong">{email}</span>
        </div>
      </div>

      <button type="button" className="btn dark" onClick={() => signOut(auth)}>
        Sign in with another account
      </button>
    </div>
  );
}
