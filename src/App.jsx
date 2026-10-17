import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isConfigured } from './lib/firebase.js';
import { checkAccess } from './lib/data.js';
import { todayKey } from './lib/dates.js';
import Login from './screens/Login.jsx';
import Denied from './screens/Denied.jsx';
import Planner from './screens/Planner.jsx';
import Editor from './screens/Editor.jsx';
import Settings from './screens/Settings.jsx';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = signed out
  const [access, setAccess] = useState(null); // { allowed, isOwner } | { error }
  const [view, setView] = useState({ name: 'planner' });
  const [date, setDate] = useState(todayKey());

  useEffect(() => {
    if (!isConfigured) return undefined;
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAccess(null);
      setView({ name: 'planner' });
      if (!u) return;
      try {
        setAccess(await checkAccess(u));
      } catch (e) {
        setAccess({ error: e.message || String(e) });
      }
    });
  }, []);

  if (!isConfigured) return <SetupNeeded />;
  if (user === undefined || (user && !access)) return <Loading />;
  if (!user) return <Login />;
  if (access.error) return <ErrorScreen message={access.error} />;
  if (!access.allowed) return <Denied email={user.email} access={access} />;

  if (view.name === 'editor') {
    return (
      <Editor
        user={user}
        item={view.item}
        defaultDate={date}
        onClose={(savedDate) => {
          if (savedDate) setDate(savedDate);
          setView({ name: 'planner' });
        }}
      />
    );
  }

  if (view.name === 'settings') {
    return (
      <Settings user={user} isOwner={access.isOwner} onBack={() => setView({ name: 'planner' })} />
    );
  }

  return (
    <Planner
      user={user}
      date={date}
      onDateChange={setDate}
      onNew={() => setView({ name: 'editor', item: null })}
      onEdit={(item) => setView({ name: 'editor', item })}
      onSettings={() => setView({ name: 'settings' })}
    />
  );
}

function Loading() {
  return (
    <div className="screen center" aria-busy="true">
      <div className="spinner" aria-label="Loading" />
    </div>
  );
}

function SetupNeeded() {
  return (
    <div className="screen padded">
      <h1 className="title">Setup required</h1>
      <p className="muted">
        Firebase config is missing. Add the <code>VITE_FIREBASE_*</code> values to{' '}
        <code>.env.local</code> for local development, or to the repo's Actions Variables for GitHub deploys.
      </p>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div className="screen padded">
      <h1 className="title">Connection error</h1>
      <p className="muted">{message}</p>
      <button type="button" className="btn primary" onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  );
}
