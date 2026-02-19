/**
 * User routines database – IndexedDB inside the application.
 * All personalised (user-created) routines are persisted here.
 *
 * Database name: KettlebellUserRoutines
 * Object store: routines (keyPath: id)
 * Each routine: { id, name, exerciseIds[], createdAt? }
 */

const DB_NAME = 'KettlebellUserRoutines';
const DB_VERSION = 1;
const STORE_NAME = 'routines';
const LEGACY_KEY = 'kettlebell-user-routines';

let dbPromise = null;
let routinesCache = [];

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      resolve(db);
    };
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
  return dbPromise;
}

/** One-time migration from localStorage into IndexedDB */
async function migrateFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return;
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const r of list) {
      if (r.id && (r.name || r.exerciseIds?.length)) {
        store.put({ id: r.id, name: r.name || 'My routine', exerciseIds: r.exerciseIds || [], createdAt: r.createdAt || Date.now() });
      }
    }
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    localStorage.removeItem(LEGACY_KEY);
  } catch (_) {
    // ignore migration errors
  }
}

/**
 * Get all user routines from the database. Also updates the sync cache.
 * @returns {Promise<Array<{ id, name, exerciseIds, createdAt? }>>}
 */
export async function getRoutines() {
  const db = await openDB();
  await migrateFromLocalStorage();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const list = req.result || [];
      routinesCache = list;
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Sync access for callers that need current list without async (e.g. export). May be [] until getRoutines() has run. */
export function getRoutinesCache() {
  return routinesCache;
}

/**
 * Save a routine (insert or update by id).
 * @param {{ id?: string, name: string, exerciseIds: string[] }} routine
 * @returns {Promise<{ id, name, exerciseIds, createdAt? }>}
 */
export async function saveRoutine(routine) {
  const db = await openDB();
  const id = routine.id || `custom-${Date.now()}`;
  const entry = {
    id,
    name: routine.name || 'My routine',
    exerciseIds: Array.isArray(routine.exerciseIds) ? routine.exerciseIds : [],
    createdAt: routine.createdAt || Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(entry);
    tx.oncomplete = () => {
      getRoutines().then(() => resolve(entry));
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Delete a routine by id.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteRoutine(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
      getRoutines().then(() => resolve());
    };
    tx.onerror = () => reject(tx.error);
  });
}
