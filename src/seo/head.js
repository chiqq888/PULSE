const START_MARKER = 'pulse:seo:start';
const END_MARKER = 'pulse:seo:end';

const htmlEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => htmlEntities[character]);
}

function renderHead(metadata) {
  const {
    title, socialTitle = title, description, siteName, locale, url, robots,
    image, imageAlt, imageType, imageWidth, imageHeight,
  } = metadata;
  const tag = (attribute, name, content) => (content ? `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />` : '');
  const meta = (name, content) => tag('name', name, content);
  const og = (name, content) => tag('property', `og:${name}`, content);

  return [
    `<title>${escapeHtml(title)}</title>`,
    meta('description', description),
    meta('robots', robots),
    url && `<link rel="canonical" href="${escapeHtml(url)}" />`,
    og('type', 'website'),
    og('site_name', siteName),
    og('locale', locale),
    og('title', socialTitle),
    og('description', description),
    og('url', url),
    og('image', image),
    og('image:alt', imageAlt),
    og('image:type', imageType),
    og('image:width', imageWidth),
    og('image:height', imageHeight),
    meta('twitter:card', 'summary_large_image'),
    meta('twitter:title', socialTitle),
    meta('twitter:description', description),
    meta('twitter:image', image),
    meta('twitter:image:alt', imageAlt),
  ].filter(Boolean).join('\n    ');
}

export function renderHtmlMetadata(html, metadata) {
  const start = `<!-- ${START_MARKER} -->`;
  const end = `<!-- ${END_MARKER} -->`;
  const startIndex = html.indexOf(start);
  const startOffset = startIndex + start.length;
  const endOffset = html.indexOf(end);
  if (startIndex < 0 || endOffset < startOffset) {
    throw new Error('The SEO markers are missing from index.html.');
  }

  return `${html.slice(0, startOffset)}\n    ${renderHead(metadata)}\n    ${html.slice(endOffset)}`;
}

export function updatePageMetadata(metadata) {
  const nodes = [...document.head.childNodes];
  const start = nodes.find((node) => node.nodeType === Node.COMMENT_NODE && node.data.trim() === START_MARKER);
  const end = nodes.find((node) => node.nodeType === Node.COMMENT_NODE && node.data.trim() === END_MARKER);
  if (!start || !end) return;

  const range = document.createRange();
  range.setStartAfter(start);
  range.setEndBefore(end);
  const fragment = range.createContextualFragment(`\n    ${renderHead(metadata)}\n    `);
  range.deleteContents();
  range.insertNode(fragment);
}
