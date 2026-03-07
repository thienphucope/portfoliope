// src/app/api/cases/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'https://rag-backend-zh2e.onrender.com';
  
  console.log(`📡 [API Route] Fetching from backend: ${backendUrl}/cases`);

  try {
    const response = await fetch(`${backendUrl}/cases`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Tạm thời tắt cache để debug cho chuẩn
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [API Route] Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText }, 
        { status: response.status }
      );
    }

    const tree = await response.json();
    console.log(`✅ [API Route] Successfully fetched tree with ${tree.length} root items`);
    return NextResponse.json(tree);
  } catch (error) {
    console.error(`❌ [API Route] Fetch failed:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
