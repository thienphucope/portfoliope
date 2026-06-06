// src/services/tools/discordMessaging.js
import { randomUUID } from 'crypto';

const DISCORD_API = 'https://discord.com/api/v10';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getConfig() {
  const token = process.env.DISCORD_BOT_TOKEN || '';
  const channelId = process.env.DISCORD_OPE_CHANNEL_ID || process.env.DISCORD_HOME_CHANNEL || process.env.DISCORD_HERMES_THREAD_ID || '';

  if (!token) throw new Error('Missing DISCORD_BOT_TOKEN');
  if (!channelId) throw new Error('Missing DISCORD_OPE_CHANNEL_ID or DISCORD_HOME_CHANNEL');

  return { token, channelId };
}

async function discordFetch(path, options = {}, retry = true) {
  const { token } = getConfig();
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (res.status === 429 && retry) {
    const data = await res.json().catch(() => ({}));
    await sleep(Math.ceil((data.retry_after || 1) * 1000));
    return discordFetch(path, options, false);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord ${res.status}: ${text || res.statusText}`);
  }

  return res.json();
}

function escapeDiscordText(value) {
  return String(value || '')
    .replace(/@everyone/g, '@\u200beveryone')
    .replace(/@here/g, '@\u200bhere')
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildConfirmationHtml(messageId) {
  return `<div style="font-family: var(--font-body); font-size: 1.05rem; color: #e0e0e0; line-height: 1.6; padding-left: 10px; border-left: 2px solid rgba(186, 145, 112, 0.3);">
  <p style="margin: 0;">Anonymous message delivered to Ope.</p>
  <p style="margin: 8px 0 0 0; font-family: var(--font-mono); font-size: 0.75rem; color: var(--colorone-dim);">receipt: ${escapeHtml(messageId)}</p>
</div>`;
}

export const sendOpeAnonymousMessage = async ({ message }) => {
  const { channelId } = getConfig();
  const cleanMessage = escapeDiscordText(message);

  if (!cleanMessage) return { error: 'Message is required' };

  const anonymousId = randomUUID().slice(0, 8);
  const content = `Moxxi: ${cleanMessage}`;

  if (content.length > 1900) {
    return { error: 'Message is too long for Discord. Keep it under 1800 characters.' };
  }

  const sent = await discordFetch(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      content,
      allowed_mentions: { parse: [] }
    })
  });

  return {
    ok: true,
    anonymousId,
    messageId: sent.id,
    html: buildConfirmationHtml(sent.id)
  };
};

export const sendOpeAnonymousMessageSchema = {
  type: "function",
  function: {
    name: "send_ope_anonymous_message",
    description: "Send an anonymous message from the website visitor to Ope through Discord. Use only when the user explicitly wants to pass, send, forward, or leave a message for Ope anonymously. After the tool returns, include result.html exactly in your final HTML response.",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The message to deliver anonymously to Ope."
        }
      },
      required: ["message"]
    }
  }
};
