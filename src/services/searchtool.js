// src/services/searchtool.js
import { Ollama } from 'ollama';

const client = new Ollama({ apiKey: process.env.OLLAMA_API_KEY });

export const webSearch = async ({ query }) => {
  try {
    console.log(`[Web Search] Đang tìm kiếm: "${query}"`);
    const data = await client.webSearch({ query });
    console.log(`[Web Search] Tìm thấy ${data.results?.length ?? 0} kết quả`);
    return { results: data.results ?? [] };
  } catch (error) {
    console.error('[Web Search] Lỗi:', error);
    return { error: error.message };
  }
};

export const webSearchSchema = {
  type: "function",
  function: {
    name: "ollama_web_search",
    description: "Tìm kiếm thông tin thực tế, tin tức, hoặc dữ liệu mới nhất trên internet. Dùng khi câu hỏi liên quan đến sự kiện hiện tại, thông tin cần cập nhật, hoặc kiến thức ngoài phạm vi của AI.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Câu truy vấn tìm kiếm, viết ngắn gọn và rõ ràng."
        }
      },
      required: ["query"]
    }
  }
};

export const webFetch = async ({ url }) => {
  try {
    console.log(`[Web Fetch] Đang fetch: "${url}"`);
    const data = await client.webFetch({ url });
    console.log(`[Web Fetch] Thành công`);
    return { content: data.content ?? '' };
  } catch (error) {
    console.error('[Web Fetch] Lỗi:', error);
    return { error: error.message };
  }
};

export const webFetchSchema = {
  type: "function",
  function: {
    name: "ollama_web_fetch",
    description: "Tải nội dung của một trang web theo URL. Dùng sau web_search khi cần đọc chi tiết nội dung của một trang cụ thể.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL đầy đủ của trang cần tải."
        }
      },
      required: ["url"]
    }
  }
};
