'use client';
import { useState, useEffect } from 'react';
import { fetchBoardItems } from '../utils/mockApi';

export function useItems() {
  const [state, setState] = useState({ items: [], connections: [], loading: true });

  useEffect(() => {
    fetchBoardItems().then(data => setState({ ...data, loading: false }));
  }, []);

  return state;
}
