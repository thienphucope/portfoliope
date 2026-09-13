function cleanTag(value) {
  return value
    .trim()
    .replace(/^[-\s]+/, '')
    .replace(/^['"]|['"]$/g, '')
    .replace(/^#/, '')
    .trim();
}

function splitInlineTags(value) {
  const unwrapped = value.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  if (!unwrapped) return [];

  const hashtags = [...unwrapped.matchAll(/(?:^|\s)#([^#,\[\]\s]+)/g)].map((match) => match[1]);
  if (hashtags.length > 1 || (hashtags.length === 1 && !unwrapped.includes(','))) {
    return hashtags;
  }

  return unwrapped.split(',').map(cleanTag).filter(Boolean);
}

export function extractNoteTags(content = '') {
  const lines = String(content).split(/\r?\n/);
  const tags = [];

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^\s*\*{0,2}tags?\s*:\s*(.*?)\s*\*{0,2}\s*$/i);
    if (!match) continue;

    const inlineValue = match[1].trim();
    if (inlineValue) {
      tags.push(...splitInlineTags(inlineValue));
      continue;
    }

    // YAML block list, for example: tags:\n  - research\n  - writing
    for (let j = i + 1; j < lines.length; j += 1) {
      const listItem = lines[j].match(/^\s+-\s+(.+?)\s*$/);
      if (!listItem) break;
      tags.push(cleanTag(listItem[1]));
      i = j;
    }
  }

  const seen = new Set();
  return tags.filter((tag) => {
    if (!tag) return false;
    const key = tag.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseNote(content, fileName, fileId, fileDate) {
  const lines = content.split('\n');
  const displayTitle = fileName.split('/').pop().replace(/\.md$/, '');

  const authorMatch = content.match(/author:\s*([^*#\n]+)/i);
  const linksMatch  = content.match(/links:\s*([^*#\n]*)/i);
  const author = authorMatch ? authorMatch[1].trim() : null;
  const parsedTags = extractNoteTags(content);
  const tags = parsedTags.length ? parsedTags : ['Archive'];
  const tag = tags[0];
  const links  = linksMatch  ? linksMatch[1].trim()  : null;

  const isSkippedLine = (t) =>
    !t || t.startsWith('#') || t.startsWith('>') || t.startsWith('![') ||
    t.startsWith('|') || /(?:youtube\.com|youtu\.be)/.test(t) ||
    /^([A-Za-z0-9\s_-]+):(\s|$)/.test(t) ||
    t.toLowerCase() === displayTitle.toLowerCase();

  const cleanJoin = (linesArr) => {
    const unique = [];
    linesArr.forEach((l) => { const c = l.trim(); if (c && !unique.includes(c)) unique.push(c); });
    return unique.join('\n\n');
  };

  const quoteMatch = content.match(/^>+ ([\s\S]*?)(?:\n\n|\n(?=[^>])|$)/m);
  let rawDescription = '';
  if (quoteMatch) {
    rawDescription = cleanJoin(quoteMatch[0].replace(/^>+\s?/gm, '').split('\n'));
  } else {
    let i = 0, blockLines = [];
    while (i < lines.length) {
      let trimmed = lines[i].trim();
      while (i < lines.length && isSkippedLine(trimmed)) { i++; if (lines[i]) trimmed = lines[i].trim(); }
      while (i < lines.length && !isSkippedLine(trimmed)) {
        blockLines.push(trimmed); i++;
        if (lines[i]) trimmed = lines[i].trim();
        if (blockLines.length >= 3) break;
      }
      if (blockLines.length > 0) { rawDescription = cleanJoin(blockLines); break; }
      i++;
    }
  }

  if (!rawDescription) rawDescription = 'No additional field notes available.';
  const words = rawDescription.split(/\s+/);
  const finalDescription = words.length > 40 ? words.slice(0, 40).join(' ') + '...' : rawDescription;
  const descriptionHtml = window.marked ? window.marked.parse(finalDescription) : finalDescription;

  let formattedDate = 'January 1, 2025';
  if (fileDate) {
    const d = new Date(fileDate);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  }

  return { id: fileId, displayTitle, author, tag, tags, links, descriptionHtml, formattedDate };
}
