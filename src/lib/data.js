import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, OWNER_EMAIL } from './firebase.js';

export const TYPES = ['할 일', '회의', '마감', '메모'];

const accessRef = () => doc(db, 'config', 'access');
const itemsCol = (uid) => collection(db, 'users', uid, 'items');

/**
 * 로그인한 사람이 들어올 수 있는지 확인.
 * 진짜 판단은 Firestore 보안 규칙이 하고, 여기서는 그 결과를 읽기만 함.
 * 규칙이 거부하면 getDoc 이 permission-denied 로 실패 -> 접근 불가.
 */
export async function checkAccess(user) {
  const email = (user.email || '').toLowerCase();
  const isOwner = !!OWNER_EMAIL && email === OWNER_EMAIL;
  try {
    const snap = await getDoc(accessRef());
    if (!snap.exists() && isOwner) {
      // 처음 로그인: 허용 목록 문서를 소유자 이메일로 생성
      await setDoc(accessRef(), { emails: [OWNER_EMAIL], updatedAt: serverTimestamp() });
    }
    return { allowed: true, isOwner };
  } catch (e) {
    if (e.code === 'permission-denied') return { allowed: false, isOwner: false };
    throw e;
  }
}

export function watchAccessList(cb, onError) {
  return onSnapshot(
    accessRef(),
    (snap) => cb(snap.exists() ? snap.data().emails || [] : []),
    onError
  );
}

export async function saveAccessList(emails) {
  const clean = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (OWNER_EMAIL && !clean.includes(OWNER_EMAIL)) clean.unshift(OWNER_EMAIL);
  await setDoc(accessRef(), { emails: clean, updatedAt: serverTimestamp() });
}

// 날짜 범위의 항목을 실시간으로 구독 (주간 스트립 점 표시 + 선택한 날 리스트)
export function watchItems(uid, fromKey, toKey, cb, onError) {
  const q = query(
    itemsCol(uid),
    where('date', '>=', fromKey),
    where('date', '<=', toKey),
    orderBy('date')
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

function cleanItem(input) {
  return {
    title: String(input.title || '').trim().slice(0, 200),
    type: TYPES.includes(input.type) ? input.type : TYPES[0],
    date: input.date,
    time: input.time || '',
    note: String(input.note || '').slice(0, 2000),
    done: !!input.done,
  };
}

export function createItem(uid, input) {
  return addDoc(itemsCol(uid), {
    ...cleanItem(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateItem(uid, id, input) {
  return updateDoc(doc(db, 'users', uid, 'items', id), {
    ...cleanItem(input),
    updatedAt: serverTimestamp(),
  });
}

export function setDone(uid, id, done) {
  return updateDoc(doc(db, 'users', uid, 'items', id), { done, updatedAt: serverTimestamp() });
}

export function removeItem(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'items', id));
}

export async function exportAll(uid) {
  const snap = await getDocs(itemsCol(uid));
  const items = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
      updatedAt: data.updatedAt?.toDate?.().toISOString() ?? null,
    };
  });
  items.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return { exportedAt: new Date().toISOString(), count: items.length, items };
}
