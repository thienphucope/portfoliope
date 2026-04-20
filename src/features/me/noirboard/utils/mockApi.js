const NEWSPAPERS = [
  { id: 'np-01', title: 'THE MIDNIGHT HERALD',   subtitle: 'BODY FOUND AT WAREHOUSE NO. 7',         content: 'Officers arrived after midnight following an anonymous tip. The victim showed signs of a violent struggle near the east loading dock. No identification found.',            date: 'NOV 14, 1952' },
];

const STICKIES = [
  { id: 'st-01', content: "Check the docks\nat midnight.\nDon't trust anyone.",     color: 'amber'  },
];

const POLAROIDS = [
  { id: 'po-01', title: 'Suspect — 11/13',         imageUrl: '/smallope.png' },
];

// Generate 10 performance test items
const PERF_TEST_ITEMS = Array.from({ length: 10 }, (_, i) => ({
  id: `perf-${i}`,
  type: 'polaroid',
  imageUrl: i % 2 === 0 ? '/watsoncrop.png' : '/saba.png',
  title: `Perf Test ${i}`
}));

const ITEMS = [
  ...POLAROIDS.map(p => ({ ...p, type: 'polaroid' })),
  { id: 'po-02', type: 'polaroid', imageUrl: '/amechrist.png' },
  { id: 'po-03', type: 'polaroid', imageUrl: '/town.jpg' },
  ...PERF_TEST_ITEMS
];

const CONNECTIONS = [
  // { from: 'np-01', to: 'po-01' }, 
  // { from: 'po-01', to: 'st-01' },
];

export async function fetchBoardItems() {
  await new Promise(r => setTimeout(r, 100));
  return { items: ITEMS, connections: CONNECTIONS };
}
