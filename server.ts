import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

function extractMetaContent(html: string, keys: string[]): string {
  for (const key of keys) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match property="og:image" content="..." or content="..." property="og:image"
    const reg1 = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      'i'
    );
    const m1 = html.match(reg1);
    if (m1 && m1[1]) return decodeHtmlEntities(m1[1].trim());

    const reg2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${escapedKey}["'][^>]*>`,
      'i'
    );
    const m2 = html.match(reg2);
    if (m2 && m2[1]) return decodeHtmlEntities(m2[1].trim());
  }
  return '';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Fetch OpenGraph metadata & thumbnail (Ảnh đại diện) from any article URL
  app.get('/api/fetch-meta', async (req, res) => {
    const rawUrl = String(req.query.url || '').trim();
    if (!rawUrl) {
      res.status(400).json({ error: 'Thiếu tham số URL bài viết.' });
      return;
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
    } catch {
      res.status(400).json({ error: 'Địa chỉ URL bài viết không hợp lệ.' });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(targetUrl.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; FacebookExternalHit/1.1; +http://www.facebook.com/externalhit_uatext.php)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const html = await response.text();

      let title =
        extractMetaContent(html, ['og:title', 'twitter:title']) ||
        (() => {
          const tMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          return tMatch && tMatch[1] ? decodeHtmlEntities(tMatch[1].trim()) : '';
        })();

      const description = extractMetaContent(html, [
        'og:description',
        'twitter:description',
        'description',
      ]);

      let image = extractMetaContent(html, [
        'og:image',
        'og:image:secure_url',
        'twitter:image',
        'twitter:image:src',
        'image',
      ]);

      // Fallback: look for first <article> or content <img> if og:image is missing
      if (!image) {
        const imgMatch = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
        if (imgMatch && imgMatch[1]) {
          image = decodeHtmlEntities(imgMatch[1]);
        }
      }

      // Resolve relative image URL
      if (image && !/^https?:\/\//i.test(image) && !image.startsWith('data:')) {
        try {
          image = new URL(image, targetUrl.origin).toString();
        } catch {
          // ignore
        }
      }

      if (!title) {
        const slug = targetUrl.pathname
          .split('/')
          .filter(Boolean)
          .pop()
          ?.replace(/\.(html|htm|php|aspx)$/i, '')
          .replace(/[-_]/g, ' ');
        title = slug
          ? slug.charAt(0).toUpperCase() + slug.slice(1)
          : `Bài viết từ ${targetUrl.hostname}`;
      }

      res.json({
        url: targetUrl.toString(),
        origin: targetUrl.origin,
        hostname: targetUrl.hostname,
        pathname: targetUrl.pathname + targetUrl.search,
        title,
        description:
          description ||
          `Bài viết được đồng bộ chuyển hướng tự động giữa domain phụ và domain chính (${targetUrl.hostname}).`,
        image,
      });
    } catch {
      // Graceful fallback if the target domain is offline or blocks requests
      const slug = targetUrl.pathname
        .split('/')
        .filter(Boolean)
        .pop()
        ?.replace(/\.(html|htm|php|aspx)$/i, '')
        .replace(/[-_]/g, ' ');
      const fallbackTitle = slug
        ? slug.charAt(0).toUpperCase() + slug.slice(1)
        : `Bài viết trên ${targetUrl.hostname}`;

      res.json({
        url: targetUrl.toString(),
        origin: targetUrl.origin,
        hostname: targetUrl.hostname,
        pathname: targetUrl.pathname + targetUrl.search,
        title: fallbackTitle,
        description: `Đường dẫn bài viết: ${targetUrl.pathname}`,
        image: '',
        fallbackUsed: true,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
