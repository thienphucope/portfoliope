// src/services/tools/book.js

export const bookGet = async ({ query, extension = 'pdf' }) => {
  try {
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    if (!RAPIDAPI_KEY) return { error: "Thiếu RAPIDAPI_KEY trong biến môi trường." };

    const performSearch = async (searchQuery, searchExt) => {
      console.log(`[Book Get] Đang tìm kiếm: "${searchQuery}" (ext: ${searchExt || 'any'})...`);
      let url = `https://annas-archive-api.p.rapidapi.com/search?q=${encodeURIComponent(searchQuery)}&cat=fiction%2Cnonfiction%2Ccomic%2Cother%2Cunknown&page=1&sort=mostRelevant&source=libgenLi%2ClibgenRs`;
      if (searchExt) url += `&ext=${searchExt}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'annas-archive-api.p.rapidapi.com' }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.books || (Array.isArray(data) ? data : []);
    };

    let books = await performSearch(query, extension);

    if (books.length === 0 && extension) {
      console.log(`[Book Get] Không thấy ${extension}, thử tìm kiếm rộng hơn (partial match)...`);
      books = await performSearch(query, null);
    }

    console.log(`[Book Get] Tìm thấy ${books.length} kết quả.`);
    if (!books || books.length === 0) return { error: "Không tìm thấy sách nào ngay cả khi tìm kiếm rộng." };

    const results = books.slice(0, 5).map(book => ({
      title: book.title,
      author: book.author,
      extension: book.extension || book.format,
      size: book.size,
      year: book.year,
      download_link: book.md5 ? `https://annas-archive.gl/slow_download/${book.md5}/0/0` : null
    })).filter(r => r.download_link);

    if (results.length === 0) return { error: "Không tìm thấy mã MD5 để tạo link tải cho các kết quả này." };

    return {
      query,
      count: results.length,
      books: results,
      note: "Đây là các link tải trực tiếp từ Anna's Archive (Slow Download)."
    };
  } catch (error) {
    console.error("[Book Get] Lỗi:", error);
    return { error: error.message };
  }
};

export const bookGetSchema = {
  type: "function",
  function: {
    name: "book_get",
    description: "Tìm kiếm và lấy trực tiếp link tải cho một cuốn sách/tài liệu. Hỗ trợ tìm kiếm mở rộng (partial match) nếu không tìm thấy kết quả chính xác. AI hãy ưu tiên rút gọn tên sách thành từ khóa chính.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Tên sách hoặc từ khóa tìm kiếm chính."
        },
        extension: {
          type: "string",
          enum: ["pdf", "epub", "mobi", "azw3"],
          description: "Định dạng file mong muốn."
        }
      },
      required: ["query"]
    }
  }
};
