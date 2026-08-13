import { useState, useEffect } from "react";
import { getPublishedChants, getCategories } from "../firebase/adminDb";

/**
 * Fetches published chants and categories from Firestore.
 * Groups chants by their categoryIds so a chant that belongs
 * to multiple categories appears under each one.
 */
export function useChants() {
  const [chants,     setChants]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [chantsData, catsData] = await Promise.all([
          getPublishedChants(),
          getCategories(),
        ]);
        if (cancelled) return;
        setChants(chantsData);
        setCategories(catsData);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  /**
   * Returns an ordered list of { category, chants[] } groups.
   * Categories with no published chants are omitted.
   */
  const grouped = categories
    .map((cat) => ({
      category: cat,
      chants:   chants.filter((c) => (c.categoryIds ?? []).includes(cat.id)),
    }))
    .filter((g) => g.chants.length > 0);

  /** Chants that have no category assigned */
  const uncategorized = chants.filter(
    (c) => !c.categoryIds || c.categoryIds.length === 0
  );

  return { chants, categories, grouped, uncategorized, loading, error };
}
