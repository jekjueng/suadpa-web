import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

// ── Refs ──────────────────────────────────────────────────────────────────────

const categoriesRef = () => collection(db, "categories");
const categoryDoc   = (id) => doc(db, "categories", id);
const chantsRef     = () => collection(db, "chants");
const chantDoc      = (id) => doc(db, "chants", id);
const userDoc       = (uid) => doc(db, "users", uid);

// ── Admin check ───────────────────────────────────────────────────────────────

export async function checkIsAdmin(uid) {
  if (!uid) return false;
  const snap = await getDoc(userDoc(uid));
  return snap.exists() && snap.data().isAdmin === true;
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories() {
  const q = query(categoriesRef(), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createCategory({ name, description = "" }) {
  const snap = await getDocs(categoriesRef());
  const order = snap.size;
  const ref = await addDoc(categoriesRef(), {
    name,
    description,
    order,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(id, data) {
  await updateDoc(categoryDoc(id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCategory(id) {
  await deleteDoc(categoryDoc(id));
}

// ── Chants ────────────────────────────────────────────────────────────────────

export async function getChants() {
  const q = query(chantsRef(), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createChant({ title, content, translation = "", categoryId, order }) {
  const snap = await getDocs(chantsRef());
  const ref = await addDoc(chantsRef(), {
    title,
    content,
    translation,
    categoryId,
    order: order ?? snap.size,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateChant(id, data) {
  await updateDoc(chantDoc(id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteChant(id) {
  await deleteDoc(chantDoc(id));
}
