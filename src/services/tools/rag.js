// src/services/tools/rag.js
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
let cachedMongoClient = null;

async function getMongoClient() {
  if (cachedMongoClient) return cachedMongoClient;
  if (!MONGODB_URI) throw new Error("Thiếu MONGODB_URI trong biến môi trường");
  cachedMongoClient = new MongoClient(MONGODB_URI);
  await cachedMongoClient.connect();
  return cachedMongoClient;
}

async function generateEmbedding(text) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error("Thiếu GEMINI_API_KEY để tạo embedding");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      outputDimensionality: 768
    })
  });

  if (!res.ok) throw new Error(`Lỗi tạo embedding: ${await res.text()}`);
  const data = await res.json();
  if (data.embedding?.values) return data.embedding.values;
  throw new Error("Không lấy được vector từ API");
}

export const ragSearch = async ({ query }) => {
  try {
    console.log(`[RAG Search] Đang tạo vector cho: "${query}"`);
    const queryVector = await generateEmbedding(query);

    const client = await getMongoClient();
    const collection = client.db('chat_db').collection('documents');

    console.log(`[RAG Search] Đang tìm kiếm trong MongoDB...`);
    const results = await collection.aggregate([
      {
        "$vectorSearch": {
          "index": "vector_index_chat",
          "path": "embedding",
          "queryVector": queryVector,
          "numCandidates": 50,
          "limit": 5
        }
      },
      {
        "$project": {
          "_id": 0,
          "embedding": 0,
          "score": { "$meta": "vectorSearchScore" }
        }
      }
    ]).toArray();

    console.log(`[RAG Search] Tìm thấy ${results.length} kết quả:`, results);
    return { results };
  } catch (error) {
    console.error("[RAG Search] Lỗi:", error);
    return { error: error.message };
  }
};

export const ragSearchSchema = {
  type: "function",
  function: {
    name: "rag_search",
    description: "Tìm kiếm thông tin cá nhân, sở thích, kiến thức của Ope Watson khi người dùng hỏi rõ ràng trong cơ sở dữ liệu tài liệu (RAG - MongoDB Vector Search). AI hãy trích xuất các từ khóa chính xác BẰNG TIẾNG ANH (ví dụ: 'age', 'favourite color', 'hobby') từ câu hỏi của người dùng. KHÔNG thêm từ khóa 'Ope', 'Watson' hay 'Ope Watson' vào query để tránh làm lệch kết quả tìm kiếm vector.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Từ khóa hoặc cụm từ ngắn gọn, súc tích bằng tiếng Anh cần tìm kiếm."
        }
      },
      required: ["query"]
    }
  }
};
