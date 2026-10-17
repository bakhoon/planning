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

  useEffect(() => watchAccessList(setEmails, (e) => setMsg('Could not load the list: ' + e.message)), []);

  const update = async (next) => {
    setBusy(true);
    setMsg('');
    try {
      await saveAccessList(next);
    } catch (e) {
      setMsg('Could not save: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const v = draft.trim().toLowerCase();
    if (!EMAIL_RE.test(v)) {
      setMsg('Please enter a valid email address.');
      return;
    }
    if (emails?.includes(v)) {
      setMsg('That email is already on the list.');
      return;
    }
    await update([...(emails || []), v]);
    setDraft('');
  };

  const remove = (email) => {
    if (!window.confirm(`Remove access for ${email}?`)) return;
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
      setMsg(`Exported ${data.count} items.`);
    } catch (e) {
      setMsg('Export failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen app">
      <header className="navbar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
          <Icon name="back" size={22} />
        </button>
        <h1 className="nav-title">Settings</h1>
        <span />
      </header>

      <main className="content settings">
        <section className="stack-10">
          <div className="stack-4">
            <h2 className="section-title">Allowed emails</h2>
            <p className="muted small">Only Google accounts with an email on this list can open the planner.</p>
          </div>

          <ul className="card list">
            {emails === null && <li className="row muted small">Loading…</li>}
            {(emails || []).map((email) => {
              const owner = email === OWNER_EMAIL;
              return (
                <li key={email} className="row">
                  <span className="email">{email}</span>
                  {owner && <span className="badge">Owner</span>}
                  {!owner && isOwner && (
                    <button
                      type="button"
                      className="icon-btn tight"
                      onClick={() => remove(email)}
                      aria-label={`Remove ${email}`}
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
              <label htmlFor="newEmail" className="field-label">Add email</label>
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
                  Add
                </button>
              </div>
            </form>
          ) : (
            <p className="muted small">Only the owner can edit this list.</p>
          )}

          <div className="notice">
            <Icon name="shield" size={16} />
            <span>Access is checked by server-side security rules, so it can't be bypassed by changing the app code.</span>
          </div>
        </section>

        <section className="stack-10">
          <h2 className="section-title">Account</h2>
          <p className="muted small">Signed in as {user.email}</p>
          <div className="card list">
            <button type="button" className="row action" onClick={backup} disabled={busy}>
              <Icon name="download" size={18} />
              Export backup (JSON)
            </button>
            <button type="button" className="row action danger" onClick={() => signOut(auth)}>
              <Icon name="logout" size={18} />
              Sign out
            </button>
          </div>
        </section>

        {msg && <p className="toast" role="status">{msg}</p>}
      </main>
    </div>
  );
}
