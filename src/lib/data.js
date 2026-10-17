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

export const TYPES = ['Task', 'Meeting', 'Deadline', 'Note'];

const accessRef = () => doc(db, 'config', 'access');
const itemsCol = (uid) => collection(db, 'users', uid, 'items');

/**
 * Check whether the signed-in user may enter.
 * The real decision is made by the Firestore security rules; this only reads the result.
 * If the rules deny access, getDoc fails with permission-denied -> access denied.
 */
export async function checkAccess(user) {
  const email = (user.email || '').toLowerCase();
  const isOwner = !!OWNER_EMAIL && email === OWNER_EMAIL;
  try {
    const snap = await getDoc(accessRef());
    if (!snap.exists() && isOwner) {
      // First sign-in: create the allowlist document with the owner's email
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

// Live subscription to items in a date range (week strip dots + selected day list)
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
