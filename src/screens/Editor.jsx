import { useState } from 'react';
import { createItem, removeItem, TYPES, updateItem } from '../lib/data.js';
import Icon from '../components/Icon.jsx';

const PLACEHOLDERS = {
  '할 일': '예: 주간 보고서 작성',
  회의: '예: 팀 미팅',
  마감: '예: 디자인 리뷰 제출',
  메모: '예: 확인할 내용',
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
      setError('저장하지 못했습니다: ' + (err.message || err));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('이 항목을 삭제할까요?')) return;
    setBusy(true);
    try {
      await removeItem(user.uid, item.id);
      onClose();
    } catch (err) {
      setError('삭제하지 못했습니다: ' + (err.message || err));
      setBusy(false);
    }
  };

  return (
    <form className="screen app" onSubmit={save}>
      <header className="navbar">
        <button type="button" className="icon-btn" onClick={() => onClose()} aria-label="닫기">
          <Icon name="close" size={22} />
        </button>
        <h1 className="nav-title">{editing ? '항목 수정' : '새 항목'}</h1>
        {editing ? (
          <button type="button" className="icon-btn danger" onClick={remove} aria-label="삭제" disabled={busy}>
            <Icon name="trash" />
          </button>
        ) : (
          <span />
        )}
      </header>

      <main className="content form">
        <div className="field">
          <span id="typeLabel" className="field-label">유형</span>
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
          <label htmlFor="title" className="field-label">제목</label>
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
            <label htmlFor="date" className="field-label">날짜</label>
            <input id="date" className="input" type="date" value={form.date} onChange={set('date')} required />
          </div>
          <div className="field">
            <label htmlFor="time" className="field-label">
              시간 <span className="optional">(선택)</span>
            </label>
            <input id="time" className="input" type="time" value={form.time} onChange={set('time')} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="note" className="field-label">
            메모 <span className="optional">(선택)</span>
          </label>
          <textarea
            id="note"
            className="input textarea"
            rows={4}
            value={form.note}
            onChange={set('note')}
            placeholder="자세한 내용을 적어주세요"
            maxLength={2000}
          />
        </div>

        {error && <p className="error-text" role="alert">{error}</p>}
      </main>

      <footer className="bottombar">
        <button type="button" className="btn outline" onClick={() => onClose()}>
          취소
        </button>
        <button type="submit" className="btn primary" disabled={!canSave}>
          {busy ? '저장 중…' : '저장'}
        </button>
      </footer>
    </form>
  );
}
