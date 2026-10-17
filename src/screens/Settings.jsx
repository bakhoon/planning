import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth, OWNER_EMAIL } from '../lib/firebase.js';
import { exportAll, saveAccessList, watchAccessList } from '../lib/data.js';
import Icon from '../components/Icon.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Settings({ user, isOwner, onBack }) {
  const [emails, setEmails] = useState(null);
  const [draft, setDraft] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => watchAccessList(setEmails, (e) => setMsg('목록을 불러오지 못했습니다: ' + e.message)), []);

  const update = async (next) => {
    setBusy(true);
    setMsg('');
    try {
      await saveAccessList(next);
    } catch (e) {
      setMsg('저장하지 못했습니다: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const v = draft.trim().toLowerCase();
    if (!EMAIL_RE.test(v)) {
      setMsg('이메일 형식을 확인해주세요.');
      return;
    }
    if (emails?.includes(v)) {
      setMsg('이미 목록에 있는 이메일입니다.');
      return;
    }
    await update([...(emails || []), v]);
    setDraft('');
  };

  const remove = (email) => {
    if (!window.confirm(`${email} 의 접근 권한을 삭제할까요?`)) return;
    update((emails || []).filter((x) => x !== email));
  };

  const backup = async () => {
    setBusy(true);
    setMsg('');
    try {
      const data = await exportAll(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planning-backup-${data.exportedAt.slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg(`${data.count}개 항목을 내보냈습니다.`);
    } catch (e) {
      setMsg('내보내기 실패: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen app">
      <header className="navbar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="뒤로">
          <Icon name="back" size={22} />
        </button>
        <h1 className="nav-title">설정</h1>
        <span />
      </header>

      <main className="content settings">
        <section className="stack-10">
          <div className="stack-4">
            <h2 className="section-title">접근 허용 이메일</h2>
            <p className="muted small">이 목록의 이메일로 Google 로그인한 계정만 플래너를 열 수 있습니다.</p>
          </div>

          <ul className="card list">
            {emails === null && <li className="row muted small">불러오는 중…</li>}
            {(emails || []).map((email) => {
              const owner = email === OWNER_EMAIL;
              return (
                <li key={email} className="row">
                  <span className="email">{email}</span>
                  {owner && <span className="badge">소유자</span>}
                  {!owner && isOwner && (
                    <button
                      type="button"
                      className="icon-btn tight"
                      onClick={() => remove(email)}
                      aria-label={`${email} 삭제`}
                      disabled={busy}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {isOwner ? (
            <form className="field" onSubmit={add}>
              <label htmlFor="newEmail" className="field-label">이메일 추가</label>
              <div className="row-gap">
                <input
                  id="newEmail"
                  className="input grow"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  placeholder="name@gmail.com"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="btn primary compact" disabled={busy || !draft.trim()}>
                  추가
                </button>
              </div>
            </form>
          ) : (
            <p className="muted small">목록은 소유자만 수정할 수 있습니다.</p>
          )}

          <div className="notice">
            <Icon name="shield" size={16} />
            <span>권한 확인은 서버의 보안 규칙에서 처리되므로 앱 코드를 바꿔도 우회할 수 없습니다.</span>
          </div>
        </section>

        <section className="stack-10">
          <h2 className="section-title">계정</h2>
          <p className="muted small">{user.email} 으로 로그인됨</p>
          <div className="card list">
            <button type="button" className="row action" onClick={backup} disabled={busy}>
              <Icon name="download" size={18} />
              데이터 백업 내보내기 (JSON)
            </button>
            <button type="button" className="row action danger" onClick={() => signOut(auth)}>
              <Icon name="logout" size={18} />
              로그아웃
            </button>
          </div>
        </section>

        {msg && <p className="toast" role="status">{msg}</p>}
      </main>
    </div>
  );
}
