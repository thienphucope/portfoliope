export function parseNote(content, fileName, fileId, fileDate) {
  const lines = content.split('\n');
  const displayTitle = fileName.split('/').pop().replace(/\.md$/, '');

  const authorMatch = content.match(/author:\s*([^*#\n]+)/i);
  const tagMatch    = content.match(/tag:\s*#?([^*#\n,\]]+)/i);
  const linksMatch  = content.match(/links:\s*([^*#\n]*)/i);
  const author = authorMatch ? authorMatch[1].trim() : null;
  const tag    = tagMatch    ? tagMatch[1].trim()    : 'Archive';
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

  return { id: fileId, displayTitle, author, tag, links, descriptionHtml, formattedDate };
}
