export async function fetchBoardItems() {
  try {
    const response = await fetch('/api/noir/items');
    if (!response.ok) throw new Error('Failed to fetch items');
    return await response.json();
  } catch (error) {
    console.error('fetchBoardItems error:', error);
    // Fallback or empty state
    return { items: [], connections: [] };
  }
}
