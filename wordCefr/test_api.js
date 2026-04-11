const fs = require('fs');
const path = require('path');

async function testDictionaryAPI() {
  // Lấy thử 3 từ ở các cấp độ khác nhau để test
  const testWords = ['abandon', 'bizarre', 'catastrophe'];
  
  console.log('--- Testing Free Dictionary API ---\n');

  for (const word of testWords) {
    try {
      console.log(`Fetching: ${word}...`);
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      
      if (!response.ok) {
        console.log(`Failed to fetch ${word}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const firstEntry = data[0];
      
      console.log(`Word: ${firstEntry.word}`);
      console.log(`Phonetic: ${firstEntry.phonetic || 'N/A'}`);
      
      firstEntry.meanings.forEach((m, i) => {
        console.log(`  Meaning ${i + 1} (${m.partOfSpeech}):`);
        m.definitions.slice(0, 2).forEach((d, j) => {
          console.log(`    - ${d.definition}`);
        });
      });
      console.log('\n-------------------\n');
    } catch (error) {
      console.error(`Error testing ${word}:`, error.message);
    }
  }
}

testDictionaryAPI();
