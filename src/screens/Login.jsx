import { useState } from 'react';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase.js';
import Icon from '../components/Icon.jsx';

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    // 팝업이 막힌 브라우저(일부 모바일)는 리다이렉트 방식으로 재시도
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
        ? '이 주소가 Firebase 승인된 도메인에 없습니다. Authentication > 설정 > 승인된 도메인에 추가하세요.'
        : '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
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
          <h1 className="display">플래너</h1>
          <p className="muted lead">날짜별 할 일과 일정을 한곳에서 관리하세요.</p>
        </div>
      </div>

      <div className="stack-14">
        {error && <p className="error-text" role="alert">{error}</p>}
        <button type="button" className="btn google" onClick={login} disabled={busy}>
          <span className="g-mark" aria-hidden="true">G</span>
          {busy ? '로그인 중…' : 'Google 계정으로 로그인'}
        </button>
        <p className="hint">
          <Icon name="lock" size={14} stroke={2.2} />
          허용된 이메일만 접근할 수 있습니다
        </p>
      </div>
    </div>
  );
}
