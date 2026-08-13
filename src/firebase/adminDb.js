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
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./config";

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

export async function createCategory({ name, description = "", imageUrl = "", order }) {
  const snap = await getDocs(categoriesRef());
  await addDoc(categoriesRef(), {
    name,
    description,
    imageUrl,
    order: order !== undefined ? Number(order) : snap.size,
    createdAt: serverTimestamp(),
  });
}

export async function updateCategory(id, { name, description, imageUrl, order }) {
  await updateDoc(categoryDoc(id), {
    name,
    description,
    imageUrl,
    order: Number(order),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id) {
  await deleteDoc(categoryDoc(id));
}

/** Upload a File object to Firebase Storage, return the public download URL. */
export async function uploadCategoryImage(file) {
  const storageRef = ref(storage, `categories/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ── Chants ────────────────────────────────────────────────────────────────────

/**
 * Normalize legacy `categoryId` (string) → `categoryIds` (string[]).
 * Treat missing `status` as "published" so existing records still appear.
 */
function normalizeChant(d) {
  const data = d.data();
  const categoryIds =
    data.categoryIds ??
    (data.categoryId ? [data.categoryId] : []);
  const status = data.status ?? "published";
  return { id: d.id, ...data, categoryIds, status };
}

export async function getChants() {
  const q = query(chantsRef(), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(normalizeChant);
}

/** Returns only published chants, ordered by `order`. */
export async function getPublishedChants() {
  const q = query(chantsRef(), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(normalizeChant).filter((c) => c.status === "published");
}

export async function createChant({
  title,
  content,
  translation = "",
  categoryIds = [],
  status = "draft",
  order,
}) {
  const snap = await getDocs(chantsRef());
  await addDoc(chantsRef(), {
    title,
    content,
    translation,
    categoryIds,
    status,
    order: order !== undefined ? Number(order) : snap.size,
    createdAt: serverTimestamp(),
  });
}

export async function updateChant(id, { title, content, translation, categoryIds, status, order }) {
  await updateDoc(chantDoc(id), {
    title,
    content,
    translation,
    categoryIds,
    status,
    order: Number(order),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteChant(id) {
  await deleteDoc(chantDoc(id));
}
