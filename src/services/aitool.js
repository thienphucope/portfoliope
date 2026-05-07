// src/services/aitool.js
import { MongoClient } from 'mongodb';

// ─── MongoDB Setup ────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || '';
let cachedMongoClient = null;

async function getMongoClient() {
  if (cachedMongoClient) return cachedMongoClient;
  if (!MONGODB_URI) throw new Error("Thiếu MONGODB_URI trong biến môi trường");
  cachedMongoClient = new MongoClient(MONGODB_URI);
  await cachedMongoClient.connect();
  return cachedMongoClient;
}

// Hàm giả định tạo embedding cho câu query (Sử dụng Gemini Text Embedding làm mặc định)
// LƯU Ý: Bạn cần dùng CÙNG MỘT MODEL embedding với model bạn đã dùng để lưu data vào MongoDB.
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
  
  if (data.embedding?.values) {
    return data.embedding.values;
  }
  throw new Error("Không lấy được vector từ API");
}

// 1. Implementations của các tools
const toolsFunctions = {
  calculator: ({ operation, a, b }) => {
    const numA = Number(a);
    const numB = Number(b);
    
    switch (operation) {
      case 'add': 
        return { result: numA + numB };
      case 'subtract': 
        return { result: numA - numB };
      case 'multiply': 
        return { result: numA * numB };
      case 'divide': 
        if (numB === 0) return { error: "Không thể chia cho 0" };
        return { result: numA / numB };
      default:
        return { error: "Phép toán không hợp lệ" };
    }
  },
  
  rag_search: async ({ query }) => {
    try {
      console.log(`[RAG Search] Đang tạo vector cho: "${query}"`);
      const queryVector = await generateEmbedding(query);
      
      const client = await getMongoClient();
      const db = client.db('chat_db');
      const collection = db.collection('documents'); // hoặc 'document' theo ý bạn
      
      console.log(`[RAG Search] Đang tìm kiếm trong MongoDB...`);
      const results = await collection.aggregate([
        {
          "$vectorSearch": {
            "index": "vector_index_chat",
            "path": "embedding",
            "queryVector": queryVector,
            "numCandidates": 50,
            "limit": 5 // Trả về 5 tài liệu gần nhất
          }
        },
        {
          "$project": {
            "_id": 0,
            "embedding": 0, // Không trả về vector (quá nặng), chỉ lấy nội dung
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
  }
};

// 2. Khai báo Schema (Định dạng OpenAI/OpenRouter - dễ map sang các AI khác)
export const availableTools = [
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Thực hiện phép tính toán học cơ bản (cộng, trừ, nhân, chia). Dùng tool này khi cần tính toán số học chính xác.",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["add", "subtract", "multiply", "divide"],
            description: "Phép toán cần thực hiện."
          },
          a: {
            type: "number",
            description: "Số hạng thứ nhất (toán hạng trái)."
          },
          b: {
            type: "number",
            description: "Số hạng thứ hai (toán hạng phải)."
          }
        },
        required: ["operation", "a", "b"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "rag_search",
      description: "Tìm kiếm thông tin cá nhân, sở thích, kiến thức trong cơ sở dữ liệu tài liệu (RAG - MongoDB Vector Search). AI hãy trích xuất các từ khóa chính xác BẰNG TIẾNG ANH (ví dụ: 'age', 'favourite color', 'hobby') từ câu hỏi của người dùng. KHÔNG thêm từ khóa 'Ope Watson' vào query trừ khi thực sự cần thiết, để tránh làm lệch kết quả tìm kiếm vector.",
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
  }
];

// 3. Hàm thực thi tool
export async function executeToolCall(toolName, args) {
  console.log(`🛠️ [Tool] AI gọi tool: ${toolName}`, args);
  
  if (toolsFunctions[toolName]) {
    try {
      // Parse string argument nếu AI trả về JSON string
      const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
      const result = await toolsFunctions[toolName](parsedArgs);
      
      // console.log(`🛠️ [Tool] Kết quả:`, result); // Ẩn bớt log để tránh in log vector dài
      return result; // Có thể return JSON.stringify(result) tùy thuộc vào model
    } catch (e) {
      console.error(`🛠️ [Tool] Lỗi khi chạy ${toolName}:`, e);
      return { error: e.message };
    }
  }
  
  return { error: `Tool ${toolName} không tồn tại` };
}
