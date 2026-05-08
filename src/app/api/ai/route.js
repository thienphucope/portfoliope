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

  try {
    const result = await handleAiRequest({ query, history, systemInstruction, provider });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
