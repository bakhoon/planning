import { useEffect, useMemo, useRef, useState } from 'react';
import { setDone, watchItems } from '../lib/data.js';
import { addDays, fromKey, longLabel, monthLabel, timeLabel, todayKey, WEEKDAYS } from '../lib/dates.js';
import Icon from '../components/Icon.jsx';
import TypeTag from '../components/TypeTag.jsx';

export default function Planner({ user, date, onDateChange, onNew, onEdit, onSettings }) {
  const start = addDays(date, -3); // 선택한 날이 가운데 오도록
  const end = addDays(start, 6);
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const dateInput = useRef(null);

  useEffect(() => {
    setError('');
    return watchItems(user.uid, start, end, setItems, (e) => setError(e.message));
  }, [user.uid, start, end]);

  const days = useMemo(() => {
    const withItems = new Set((items || []).map((it) => it.date));
    return Array.from({ length: 7 }, (_, i) => {
      const key = addDays(start, i);
      const d = fromKey(key);
      return { key, num: d.getDate(), wd: WEEKDAYS[d.getDay()], has: withItems.has(key) };
    });
  }, [items, start]);

  const list = useMemo(() => {
    return (items || [])
      .filter((it) => it.date === date)
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.time !== b.time) return (a.time || '99') < (b.time || '99') ? -1 : 1;
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      });
  }, [items, date]);

  const doneCount = list.filter((it) => it.done).length;
  const pct = list.length ? Math.round((doneCount / list.length) * 100) : 0;
  const isToday = date === todayKey();

  const openPicker = () => {
    const el = dateInput.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.click();
  };

  return (
    <div className="screen app">
      <header className="topbar">
        <div className="row-between">
          <div className="stack-2">
            <span className="label-sm">{monthLabel(date)}</span>
            <div className="date-title-wrap">
              <button type="button" className="date-title" onClick={openPicker} aria-label="날짜 선택">
                {longLabel(date)}
              </button>
              <input
                ref={dateInput}
                className="visually-hidden-input"
                type="date"
                value={date}
                onChange={(e) => e.target.value && onDateChange(e.target.value)}
                tabIndex={-1}
                aria-hidden="true"
              />
              {!isToday && (
                <button type="button" className="chip-btn" onClick={() => onDateChange(todayKey())}>
                  오늘
                </button>
              )}
            </div>
          </div>
          <button type="button" className="icon-btn bordered" onClick={onSettings} aria-label="설정">
            <Icon name="settings" />
          </button>
        </div>

        <div className="week">
          <button type="button" className="week-arrow" onClick={() => onDateChange(addDays(date, -7))} aria-label="이전 주">
            <Icon name="chevronLeft" size={18} />
          </button>
          {days.map((d) => {
            const selected = d.key === date;
            return (
              <button
                key={d.key}
                type="button"
                className={'day' + (selected ? ' selected' : '')}
                onClick={() => onDateChange(d.key)}
                aria-pressed={selected}
                aria-label={longLabel(d.key)}
              >
                <span className="day-wd">{d.wd}</span>
                <span className="day-num">{d.num}</span>
                <span className={'day-dot' + (d.has ? ' on' : '')} aria-hidden="true" />
              </button>
            );
          })}
          <button type="button" className="week-arrow" onClick={() => onDateChange(addDays(date, 7))} aria-label="다음 주">
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </header>

      <main className="content">
        {error && <p className="error-text" role="alert">불러오기 실패: {error}</p>}

        {items === null && !error && <div className="spinner small" aria-label="불러오는 중" />}

        {items !== null && list.length > 0 && (
          <>
            <div className="stack-8">
              <div className="row-between small">
                <span className="strong">진행률</span>
                <span className="muted">
                  {list.length}개 중 {doneCount}개 완료
                </span>
              </div>
              <div className="progress" aria-hidden="true">
                <div className="progress-bar" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <ul className="card list">
              {list.map((it) => (
                <li key={it.id} className="item">
                  <button
                    type="button"
                    className={'check' + (it.done ? ' on' : '')}
                    onClick={() => setDone(user.uid, it.id, !it.done)}
                    aria-pressed={it.done}
                    aria-label={it.title + (it.done ? ' 완료 취소' : ' 완료로 표시')}
                  >
                    <span className="check-box">{it.done && <Icon name="check" size={14} stroke={3.5} />}</span>
                  </button>
                  <button type="button" className="item-body" onClick={() => onEdit(it)}>
                    <span className={'item-title' + (it.done ? ' done' : '')}>{it.title}</span>
                    <span className="item-meta">
                      <TypeTag type={it.type} />
                      {it.time && <span>{timeLabel(it.time)}</span>}
                      {it.note && <span className="note-preview">{it.note}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {items !== null && list.length === 0 && !error && (
          <div className="empty">
            <span className="strong">등록된 항목이 없습니다</span>
            <span className="muted small">아래 버튼으로 새 항목을 추가하세요.</span>
          </div>
        )}
      </main>

      <button type="button" className="fab" onClick={onNew}>
        <Icon name="plus" size={18} stroke={2.6} />
        새 항목
      </button>
    </div>
  );
}
