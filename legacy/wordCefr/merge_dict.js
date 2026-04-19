const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, 'ENGLISH_CERF_WORDS.csv');
const DICT_PATH = path.join(__dirname, 'dict.txt');
const OUTPUT_PATH = path.join(__dirname, '../src/features/case/utils/cefr_dict.json');

function process() {
  console.log('Starting dictionary merge with new CSV source...');

  // 1. Parse New CEFR CSV (headword,CEFR)
  const cefrData = {};
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csvContent.split(/\r?\n/);
  
  lines.forEach((line, index) => {
    if (index === 0 || !line.trim()) return;
    
    // Handle comma separated values, being careful with commas inside quotes if any
    // This CSV looks simple enough for a basic split
    const lastCommaIndex = line.lastIndexOf(',');
    if (lastCommaIndex === -1) return;
    
    const wordPart = line.substring(0, lastCommaIndex).trim();
    const level = line.substring(lastCommaIndex + 1).trim().toUpperCase();
    
    // Some lines have multiple words: a.m./A.M./am/AM
    const words = wordPart.split('/');
    
    words.forEach(w => {
      const cleanWord = w.toLowerCase().trim();
      if (!cleanWord) return;
      
      // Initialize if not exists
      if (!cefrData[cleanWord]) {
        cefrData[cleanWord] = { level, definitions: [] };
      }
    });
  });

  // 2. Parse dict.txt for fallback definitions
  if (fs.existsSync(DICT_PATH)) {
    const dictContent = fs.readFileSync(DICT_PATH, 'utf-8');
    // Regex to find word entries at the start of a block
    const entries = dictContent.split(/\n(?=[A-Z][a-z\-]+(?:\s{2,}|(?:\s+[a-z]+\.\s+)))/);

    entries.forEach(entry => {
      const lines = entry.trim().split('\n');
      if (lines.length === 0) return;
      
      const firstLine = lines[0];
      const match = firstLine.match(/^([A-Za-z\-]+)\s+(?:—)?([a-z]+\.)\s+(.*)/);
      
      if (match) {
        const word = match[1].toLowerCase().trim();
        const pos = match[2].trim();
        const def = (match[3] + ' ' + lines.slice(1).join(' ')).trim();
        
        if (cefrData[word]) {
          cefrData[word].definitions.push({ pos, def });
        }
      }
    });
  }

  // 3. Save to JSON
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cefrData, null, 2));
  console.log(`Successfully updated ${OUTPUT_PATH} with ${Object.keys(cefrData).length} words.`);
}

process();
