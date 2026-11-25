import { useCallback, useEffect, useRef, useState } from 'react';
import { getCategories } from '../services/categoryService';
import { isAbortError } from '../services/apiClient';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestSeqRef = useRef(0);
  const abortRef = useRef(null);

  const fetchCategories = useCallback(async ({ silent = false } = {}) => {
    const seq = ++requestSeqRef.current;
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await getCategories({ signal: controller.signal });
      if (seq !== requestSeqRef.current) return;
      setCategories(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (isAbortError(err) || seq !== requestSeqRef.current) return;
      setError(err);
    } finally {
      if (seq === requestSeqRef.current && !silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    return () => {
      requestSeqRef.current += 1;
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
}
