// scripts/test-books.mjs
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function testRapidAPI() {
  if (!RAPIDAPI_KEY) {
    console.error("❌ RAPIDAPI_KEY is not set in environment.");
    return;
  }

  const query = "the little prince";
  console.log(`🚀 Testing Search for: "${query}"...`);
  const searchUrl = `https://annas-archive-api.p.rapidapi.com/search?q=${encodeURIComponent(query)}&cat=fiction&page=1&ext=pdf&sort=mostRelevant&source=libgenLi`;
  
  try {
    const sRes = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'annas-archive-api.p.rapidapi.com'
      }
    });

    const sData = await sRes.json();
    const books = sData.books || sData;
    
    if (books && books.length > 0) {
        const book = books[0];
        console.log("📖 Book Data:", JSON.stringify(book, null, 2));
        
        const md5 = book.md5;
        if (!md5) {
            console.error("❌ No MD5 found in book object.");
            return;
        }

        console.log(`\n🚀 Testing Download for MD5: ${md5}...`);
        const dUrl = `https://annas-archive-api.p.rapidapi.com/download?md5=${md5}`;
        const dRes = await fetch(dUrl, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': 'annas-archive-api.p.rapidapi.com'
            }
        });

        const dData = await dRes.json();
        if (dRes.ok) {
            console.log("✅ Download Info:", JSON.stringify(dData, null, 2));
        } else {
            console.error(`❌ Download Error ${dRes.status}:`, dData);
        }
    } else {
        console.log("⚠️ No books found.");
    }
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
}

testRapidAPI();
