export const KAOMOJI_PARTS = [
  { key: 'smile', leftWrap: '(', leftEye: '^', mouth: '_', rightEye: '^', rightWrap: ')' },
  { key: 'joy', leftWrap: '(', leftEye: '≧', mouth: '∇', rightEye: '≦', rightWrap: ')' },
  { key: 'neutral', leftWrap: '(', leftEye: '・', mouth: '_', rightEye: '・', rightWrap: ')' },
  { key: 'surprise', leftWrap: '(', leftEye: 'o', mouth: '_', rightEye: 'o', rightWrap: ')' },
  { key: 'unamused', leftWrap: '(', leftEye: '¬', mouth: '_', rightEye: '¬', rightWrap: ')' },
  { key: 'shy', leftWrap: '(', leftEye: '>', mouth: '_', rightEye: '<', rightWrap: ')' },
  { key: 'sparkle', leftWrap: '(', leftEye: '*', mouth: '_', rightEye: '*', rightWrap: ')' },
  { key: 'cry', leftWrap: '(', leftEye: 'T', mouth: '_', rightEye: 'T', rightWrap: ')' },
  { key: 'wink', leftWrap: '(', leftEye: '^', mouth: '_', rightEye: '~', rightWrap: ')' },
  { key: 'sleepy', leftWrap: '(', leftEye: '-', mouth: '_', rightEye: '-', rightWrap: ')' },
  { key: 'angry', leftWrap: '(', leftEye: '>', mouth: '皿', rightEye: '<', rightWrap: ')' },
  { key: 'worried', leftWrap: '(', leftEye: '・', mouth: 'へ', rightEye: '・', rightWrap: ')' },
  { key: 'smug', leftWrap: '(', leftEye: '¬', mouth: '‿', rightEye: '¬', rightWrap: ')' },
  { key: 'pleased', leftWrap: '(', leftEye: '⌒', mouth: '‿', rightEye: '⌒', rightWrap: ')' },
  { key: 'focused', leftWrap: '(', leftEye: '・', mouth: '︵', rightEye: '・', rightWrap: ')' },
  { key: 'confused', leftWrap: '(', leftEye: 'o', mouth: 'へ', rightEye: 'O', rightWrap: ')' },
  { key: 'dizzy', leftWrap: '(', leftEye: '＠', mouth: '_', rightEye: '＠', rightWrap: ')' },
  { key: 'love', leftWrap: '(', leftEye: '♡', mouth: '_', rightEye: '♡', rightWrap: ')' },
  { key: 'deadpan', leftWrap: '(', leftEye: 'ー', mouth: '_', rightEye: 'ー', rightWrap: ')' },
  { key: 'blush', leftWrap: '(', leftEye: '⁄', mouth: '_', rightEye: '⁄', rightWrap: ')' },
  { key: 'uwu', leftWrap: '(', leftEye: '˘', mouth: 'ω', rightEye: '˘', rightWrap: ')' },
  { key: 'owo', leftWrap: '(', leftEye: 'O', mouth: 'ω', rightEye: 'O', rightWrap: ')' },
  { key: 'determined', leftWrap: '(', leftEye: 'ง', mouth: '_', rightEye: 'ง', rightWrap: ')' },
  { key: 'suspicious', leftWrap: '(', leftEye: 'ಠ', mouth: '_', rightEye: 'ಠ', rightWrap: ')' },
];

export const KAOMOJI_BY_KEY = Object.fromEntries(
  KAOMOJI_PARTS.map((kaomoji) => [kaomoji.key, kaomoji])
);

export const KAOMOJI_KEYS = KAOMOJI_PARTS.map((kaomoji) => kaomoji.key);

export const IDLE_KAOMOJI_KEYS = [
  'smile',
  'neutral',
];

export function getKaomojiKey(key) {
  return KAOMOJI_BY_KEY[key] ? key : 'smile';
}
