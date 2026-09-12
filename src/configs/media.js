export const MUSIC_PLAYER = {
  volume: 30,
  // Playlist for the sidebar player. Add more YouTube video IDs to extend it;
  // the player reads each track's title from YouTube at runtime.
  tracks: [
    'KtC-pl9P3kE',
    'ivVQYpGGvuc',
    '0o65YL4UikI',
  ],
};

export const BACKGROUND_VIDEO = {
  videoId: '305Uc8i5RJM',
  start: 50,
  end: 118,
};

// Gallery page embeds. One section per playlist; videos are fetched + shuffled.
export const GALLERY_PLAYLISTS = [
  { title: 'Section 01', playlistId: 'PLo2L9JmoQoy94NKhBLuQzFsAVKHVr5cmG' },
  { title: 'Section 02', playlistId: 'PLRNOK1E5gA8Ud8E1duLN_jMnfoTSPtHit' },
  { title: 'Section 03', playlistId: 'PLo2L9JmoQoy_jVwTJhA3QF3a98n2Dcga2' },
];
