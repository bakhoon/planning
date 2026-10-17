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
  const [user, setUser] = useState(undefined); // undefined = 확인 중, null = 로그아웃
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
  if (!access.allowed) return <Denied email={user.email} />;

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
      <div className="spinner" aria-label="불러오는 중" />
    </div>
  );
}

function SetupNeeded() {
  return (
    <div className="screen padded">
      <h1 className="title">설정이 필요합니다</h1>
      <p className="muted">
        Firebase 설정값이 없습니다. 로컬에서는 <code>.env.local</code>, GitHub 배포에서는 레포의
        Actions Variables 에 <code>VITE_FIREBASE_*</code> 값을 넣어주세요.
      </p>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div className="screen padded">
      <h1 className="title">연결 오류</h1>
      <p className="muted">{message}</p>
      <button type="button" className="btn primary" onClick={() => window.location.reload()}>
        다시 시도
      </button>
    </div>
  );
}
