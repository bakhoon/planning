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
          <h1 className="title">접근 권한이 없습니다</h1>
          <p className="muted">
            이 플래너는 허용된 이메일로만 사용할 수 있습니다. {left}초 후 자동으로 로그아웃됩니다.
          </p>
        </div>
        <div className="card info-card">
          <span className="label-sm">로그인한 계정</span>
          <span className="strong">{email}</span>
        </div>
      </div>

      <button type="button" className="btn dark" onClick={() => signOut(auth)}>
        다른 계정으로 로그인
      </button>
    </div>
  );
}
