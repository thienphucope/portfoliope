const YT_REGEX = /(?:youtube\.com\/(?:[^/\n]+\/[^\n]+\/|(?:v|e(?:mbed)?)\/|[^\n]*?[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function extractMedia(content) {
  const items = [];
  const videoMatch = content.match(YT_REGEX);
  if (videoMatch) items.push({ type: 'youtube', videoId: videoMatch[1] });

  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  let imgMatch;
  while ((imgMatch = imageRegex.exec(content)) !== null) {
    const lineStart = content.lastIndexOf('\n', imgMatch.index) + 1;
    const lineEnd = content.indexOf('\n', imgMatch.index);
    const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (!YT_REGEX.test(line)) { items.push({ type: 'image', url: imgMatch[1] }); break; }
  }
  return items;
}
