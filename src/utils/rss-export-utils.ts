/**
 * Generate and download an RSS feed file with the provided content
 */
export const generateRSSFeed = (
  title: string,
  content: string,
  author?: string,
  link?: string
) => {
  const now = new Date();
  const pubDate = now.toUTCString();
  
  // Clean and escape XML special characters
  const escapeXml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const cleanTitle = escapeXml(title || 'Matéria sem título');
  const cleanContent = escapeXml(content || '');
  const cleanAuthor = author ? escapeXml(author) : 'Redação';
  const cleanLink = link || 'https://example.com';

  // Generate RSS 2.0 feed
  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>NewsRoomate - Export</title>
    <link>${cleanLink}</link>
    <description>Conteúdo exportado do NewsRoomate</description>
    <language>pt-BR</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <item>
      <title>${cleanTitle}</title>
      <link>${cleanLink}</link>
      <description>${cleanContent}</description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
      <dc:creator>${cleanAuthor}</dc:creator>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${now.getTime()}</guid>
    </item>
  </channel>
</rss>`;

  // Create blob and download
  const blob = new Blob([rssFeed], { type: 'application/rss+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link_element = document.createElement('a');
  
  // Create safe filename
  const safeTitle = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  link_element.href = url;
  link_element.download = `${safeTitle}_${now.getTime()}.xml`;
  document.body.appendChild(link_element);
  link_element.click();
  document.body.removeChild(link_element);
  URL.revokeObjectURL(url);

  console.log('RSS feed generated and downloaded:', link_element.download);
};
