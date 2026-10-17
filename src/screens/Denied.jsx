import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import Icon from '../components/Icon.jsx';

const AUTO_LOGOUT_SECONDS = 8;

export default function Denied({ email, access = {} }) {
  const [left, setLeft] = useState(AUTO_LOGOUT_SECONDS);
  // The owner being denied means a setup problem, not an intruder: stay signed in and show why
  const setupProblem = !!access.ownerEmailMatch;

  useEffect(() => {
    if (setupProblem) return undefined;
    if (left <= 0) {
      signOut(auth);
      return undefined;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, setupProblem]);

  return (
    <div className="screen login">
      <div className="login-top">
        <div className="app-mark danger" aria-hidden="true">
          <Icon name="lock" size={28} />
        </div>
        <div className="stack-8">
          <h1 className="title">{setupProblem ? 'Server rejected the owner' : 'Access denied'}</h1>
          {setupProblem ? (
            <p className="muted">
              You are signed in with the owner email, but Firestore refused the request. This usually
              means the security rules in <code>firestore.rules</code> are not published yet, or the
              email in the rules&apos; OWNER line does not match.
            </p>
          ) : (
            <p className="muted">
              This planner is only available to approved emails. You will be signed out in {left}s.
            </p>
          )}
        </div>
        <div className="card info-card">
          <span className="label-sm">Signed in as</span>
          <span className="strong">{email}</span>
        </div>
        {access.code && (
          <div className="card info-card">
            <span className="label-sm">Error</span>
            <span className="small" style={{ overflowWrap: 'anywhere' }}>
              {access.code}: {access.detail}
            </span>
          </div>
        )}
      </div>

      <button type="button" className="btn dark" onClick={() => signOut(auth)}>
        Sign in with another account
      </button>
    </div>
  );
}
