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
  where,
  serverTimestamp,
  limit,
  getCountFromServer,
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

// ── Users ─────────────────────────────────────────────────────────────────────

/**
 * Derive a unified `role` string from the stored fields.
 * Existing docs only have `isAdmin: boolean`; new docs will also have `role`.
 */
function normalizeRole(data) {
  if (data.role) return data.role;
  if (data.isAdmin === true) return "admin";
  return "user";
}

/**
 * Fetch all non-anonymous user profiles (docs that have an email address),
 * ordered by most-recently-seen first. Capped at 500 for safety.
 */
export async function getUsers() {
  const q = query(
    collection(db, "users"),
    orderBy("lastSeenAt", "desc"),
    limit(500)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data(), role: normalizeRole(d.data()) }))
    .filter((u) => u.email); // exclude anonymous users (no email)
}

/**
 * Update a user's role in Firestore.
 * Writes both `role` (new field) and `isAdmin` (legacy field) for compatibility.
 */
export async function updateUserRole(uid, role) {
  await updateDoc(doc(db, "users", uid), {
    role,
    isAdmin: role === "admin",
    updatedAt: serverTimestamp(),
  });
}

// ── Dashboard / Analytics ─────────────────────────────────────────────────────

/**
 * Returns KPI counts using getCountFromServer — costs exactly 3 Firestore reads
 * regardless of how many documents exist in each collection.
 */
export async function getDashboardStats() {
  const [usersSnap, catsSnap, chantsSnap] = await Promise.all([
    getCountFromServer(
      query(collection(db, "users"), where("email", "!=", null))
    ),
    getCountFromServer(collection(db, "categories")),
    getCountFromServer(
      query(collection(db, "chants"), where("status", "==", "published"))
    ),
  ]);

  return {
    usersCount:      usersSnap.data().count,
    categoriesCount: catsSnap.data().count,
    chantsCount:     chantsSnap.data().count,
  };
}

/**
 * Returns the top N chants ordered by viewCount descending.
 * Uses a single-field index (auto-created by Firestore) — no composite index needed.
 */
export async function getTopChants(n = 5) {
  const q = query(
    collection(db, "chants"),
    orderBy("viewCount", "desc"),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map(normalizeChant);
}
