// scripts/reembed.mjs
import { MongoClient } from 'mongodb';

// Lấy biến môi trường trực tiếp từ process.env (Sẽ dùng flag --env-file của Node 20+)
const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!MONGODB_URI || !GEMINI_API_KEY) {
  console.error("❌ Thiếu MONGODB_URI hoặc GEMINI_API_KEY. Đảm bảo bạn đã truyền biến môi trường.");
  process.exit(1);
}

async function generateEmbedding(text) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      outputDimensionality: 768
    })
  });
  
  if (!res.ok) throw new Error(`Lỗi API Gemini: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values;
}

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log("✅ Đã kết nối MongoDB.");
    
    const db = client.db('chat_db');
    const collection = db.collection('documents');
    
    const docs = await collection.find({}).toArray();
    console.log(`📦 Tìm thấy ${docs.length} tài liệu cần cập nhật.`);
    
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const content = doc.text || doc.content || "";
      
      if (!content) {
        console.warn(`⚠️ Bỏ qua tài liệu ${doc._id} vì không có nội dung text.`);
        continue;
      }
      
      try {
        process.stdout.write(`⏳ [${i + 1}/${docs.length}] Đang xử lý: ${doc._id}... `);
        const newEmbedding = await generateEmbedding(content);
        
        await collection.updateOne(
          { _id: doc._id },
          { $set: { embedding: newEmbedding } }
        );
        console.log("Xong!");
      } catch (err) {
        console.error(`\n❌ Lỗi khi xử lý tài liệu ${doc._id}:`, err.message);
      }
      
      // Tránh bị rate limit API (nghỉ 100ms mỗi lượt)
      await new Promise(r => setTimeout(r, 100));
    }
    
    console.log("\n✨ Hoàn thành cập nhật tất cả embedding!");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
