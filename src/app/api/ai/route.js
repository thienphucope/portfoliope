// src/app/api/ai/route.js
import { NextResponse } from 'next/server';
import { handleAiRequest } from '@/services/ai';

const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000; // 1 minute
const ipRateMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { query, history, systemInstruction, provider } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      try {
        const onToken = (chunk) => send({ type: 'text_delta', text: chunk });
        const result = await handleAiRequest(
          { query, history, systemInstruction, provider },
          (tc) => send({ type: 'tool_call', name: tc.name, args: tc.args }),
          onToken
        );
        send({ type: 'done', response: result.response, provider: result.provider });
      } catch (e) {
        send({ type: 'error', error: e.message });
      }
      controller.close();
    }
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
