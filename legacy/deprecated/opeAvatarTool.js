// src/services/tools/opeAvatar.js
import { KAOMOJI_KEYS } from '../../components/ui/OpeAvatar/kaomojis.js';

function countChars(value) {
  return Array.from(String(value || '')).length;
}

function normalizeCustomKaomoji(input = {}) {
  return {
    key: input.key || input.emotion || input.name,
    leftWrap: input.leftWrap || input.left_wrap || input.left_wrapper || input.open || '(',
    leftEye: input.leftEye || input.left_eye || input.eyeLeft || input.eye_left,
    mouth: input.mouth,
    rightEye: input.rightEye || input.right_eye || input.eyeRight || input.eye_right,
    rightWrap: input.rightWrap || input.right_wrap || input.right_wrapper || input.close || ')',
  };
}

function validateCustomKaomoji(input) {
  const { key, leftWrap, leftEye, mouth, rightEye, rightWrap } = normalizeCustomKaomoji(input);
  if (!key || typeof key !== 'string') return 'key is required';
  if (countChars(leftWrap) < 1 || countChars(leftWrap) > 2) return 'leftWrap must be 1-2 characters';
  if (countChars(rightWrap) < 1 || countChars(rightWrap) > 2) return 'rightWrap must be 1-2 characters';
  if (countChars(leftEye) !== 1) return 'leftEye must be exactly 1 character';
  if (countChars(mouth) !== 1) return 'mouth must be exactly 1 character';
  if (countChars(rightEye) !== 1) return 'rightEye must be exactly 1 character';
  return null;
}

export const setOpeAvatarEmotion = async ({ emotion }) => {
  if (!KAOMOJI_KEYS.includes(emotion)) {
    return {
      error: `Unknown emotion: ${emotion}`,
      available: KAOMOJI_KEYS,
    };
  }

  return {
    ok: true,
    emotion,
    available: KAOMOJI_KEYS,
  };
};

export const setOpeAvatarCustomEmotion = async (input) => {
  const kaomoji = normalizeCustomKaomoji(input);
  const error = validateCustomKaomoji(kaomoji);
  if (error) return { error };

  return { ok: true, kaomoji };
};

export const setOpeAvatarEmotionSchema = {
  type: "function",
  function: {
    name: "ope_avatar_set_emotion",
    description: "Queue one built-in visible kaomoji avatar emotion for Ope. Each call advances Ope's face in order; if no more calls arrive, the avatar returns to idle shortly after the queue drains. Use built-in keys when enough.",
    parameters: {
      type: "object",
      properties: {
        emotion: {
          type: "string",
          enum: KAOMOJI_KEYS,
          description: "Built-in avatar emotion key to display."
        },
      },
      required: ["emotion"]
    }
  }
};

export const setOpeAvatarCustomEmotionSchema = {
  type: "function",
  function: {
    name: "ope_avatar_set_custom_emotion",
    description: "Queue one custom kaomoji avatar emotion for Ope when built-in emotions are not expressive enough. Provide a custom key and all face parts. The layout is slot-based: leftWrap + leftEye + mouth + rightEye + rightWrap.",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Short custom emotion key, for example 'intrigued', 'scheming', or 'caught_a_clue'."
        },
        leftWrap: {
          type: "string",
          minLength: 1,
          maxLength: 2,
          description: "Left wrapper, usually '(' or '(*'."
        },
        leftEye: {
          type: "string",
          minLength: 1,
          maxLength: 1,
          description: "Left eye, exactly one character."
        },
        mouth: {
          type: "string",
          minLength: 1,
          maxLength: 1,
          description: "Mouth, exactly one character."
        },
        rightEye: {
          type: "string",
          minLength: 1,
          maxLength: 1,
          description: "Right eye, exactly one character."
        },
        rightWrap: {
          type: "string",
          minLength: 1,
          maxLength: 2,
          description: "Right wrapper, usually ')' or '*)'."
        }
      },
      required: ["key", "leftWrap", "leftEye", "mouth", "rightEye", "rightWrap"]
    }
  }
};
