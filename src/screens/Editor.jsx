import { useState } from 'react';
import { createItem, removeItem, TYPES, updateItem } from '../lib/data.js';
import Icon from '../components/Icon.jsx';

const PLACEHOLDERS = {
  Task: 'e.g. Write weekly report',
  Meeting: 'e.g. Team sync',
  Deadline: 'e.g. Submit design review',
  Note: 'e.g. Something to remember',
};

export default function Editor({ user, item, defaultDate, onClose }) {
  const editing = !!item;
  const [form, setForm] = useState({
    type: item?.type || TYPES[0],
    title: item?.title || '',
    date: item?.date || defaultDate,
    time: item?.time || '',
    note: item?.note || '',
    done: item?.done || false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const canSave = form.title.trim().length > 0 && !!form.date && !busy;

  const save = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError('');
    try {
      if (editing) await updateItem(user.uid, item.id, form);
      else await createItem(user.uid, form);
      onClose(form.date);
    } catch (err) {
      setError('Could not save: ' + (err.message || err));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this item?')) return;
    setBusy(true);
    try {
      await removeItem(user.uid, item.id);
      onClose();
    } catch (err) {
      setError('Could not delete: ' + (err.message || err));
      setBusy(false);
    }
  };

  return (
    <form className="screen app" onSubmit={save}>
      <header className="navbar">
        <button type="button" className="icon-btn" onClick={() => onClose()} aria-label="Close">
          <Icon name="close" size={22} />
        </button>
        <h1 className="nav-title">{editing ? 'Edit item' : 'New item'}</h1>
        {editing ? (
          <button type="button" className="icon-btn danger" onClick={remove} aria-label="Delete" disabled={busy}>
            <Icon name="trash" />
          </button>
        ) : (
          <span />
        )}
      </header>

      <main className="content form">
        <div className="field">
          <span id="typeLabel" className="field-label">Type</span>
          <div className="segmented" role="group" aria-labelledby="typeLabel">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={'seg' + (form.type === t ? ' on' : '')}
                aria-pressed={form.type === t}
                onClick={() => setForm((f) => ({ ...f, type: t }))}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="title" className="field-label">Title</label>
          <input
            id="title"
            className="input"
            type="text"
            value={form.title}
            onChange={set('title')}
            placeholder={PLACEHOLDERS[form.type]}
            maxLength={200}
            autoFocus={!editing}
            required
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="date" className="field-label">Date</label>
            <input id="date" className="input" type="date" value={form.date} onChange={set('date')} required />
          </div>
          <div className="field">
            <label htmlFor="time" className="field-label">
              Time <span className="optional">(optional)</span>
            </label>
            <input id="time" className="input" type="time" value={form.time} onChange={set('time')} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="note" className="field-label">
            Notes <span className="optional">(optional)</span>
          </label>
          <textarea
            id="note"
            className="input textarea"
            rows={4}
            value={form.note}
            onChange={set('note')}
            placeholder="Add details"
            maxLength={2000}
          />
        </div>

        {error && <p className="error-text" role="alert">{error}</p>}
      </main>

      <footer className="bottombar">
        <button type="button" className="btn outline" onClick={() => onClose()}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={!canSave}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </footer>
    </form>
  );
}
