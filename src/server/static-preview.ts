import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createReadStream } from 'node:fs';

export const PREVIEW_PORT = 4321;

let server: http.Server | null = null;

export type PreviewStatus =
  | { ok: true; status: 'starting' }
  | { ok: true; status: 'already_running' }
  | { ok: true; status: 'stopped' }
  | { ok: false; message: string };

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getMime(filePath: string): string {
  return MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

async function resolveFile(outputDir: string, urlPath: string): Promise<string | null> {
  // Normalise: strip query string, decode
  let p = decodeURIComponent(urlPath.split('?')[0]);

  // Strip leading slash
  if (p.startsWith('/')) p = p.slice(1);

  // Root → index.html
  if (p === '' || p === '/') p = 'index.html';

  const candidates = [
    path.join(outputDir, p),
    path.join(outputDir, p + '.html'),
    path.join(outputDir, p, 'index.html'),
  ];

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) return candidate;
    } catch { /* not found */ }
  }
  return null;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
};

function createStaticServer(outputDir: string): http.Server {
  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    const filePath = await resolveFile(outputDir, req.url ?? '/');

    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/plain', ...CORS_HEADERS });
      res.end('404 Not Found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getMime(filePath), ...CORS_HEADERS });
    createReadStream(filePath).pipe(res);
  });
}

export async function startPreview(outputDir: string): Promise<PreviewStatus> {
  if (server) {
    return { ok: true, status: 'already_running' };
  }

  const absOutput = path.resolve(process.cwd(), outputDir);

  try {
    await fs.access(absOutput);
  } catch {
    return { ok: false, message: 'Output directory not found. Run generate first.' };
  }

  server = createStaticServer(absOutput);
  server.listen(PREVIEW_PORT);
  server.on('close', () => { server = null; });

  return { ok: true, status: 'starting' };
}

export function stopPreview(): PreviewStatus {
  if (!server) {
    return { ok: true, status: 'stopped' };
  }
  server.close();
  server = null;
  return { ok: true, status: 'stopped' };
}

export function getPreviewStatus(): { running: boolean; port: number } {
  return { running: server !== null, port: PREVIEW_PORT };
}
