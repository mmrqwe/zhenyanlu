import http from 'node:http';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.PORT || 4173);
const compressibleExtensions = new Set(['.html', '.js', '.css', '.svg', '.txt', '.json']);
const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon'],
  ['.json', 'application/json; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function resolvePath(requestUrl) {
  const url = new URL(requestUrl, 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === '/favicon.ico') {
    pathname = '/favicon.svg';
  }

  if (pathname.endsWith('/')) {
    pathname = `${pathname}index.html`;
  }

  if (!path.extname(pathname)) {
    pathname = path.posix.join(pathname, 'index.html');
  }

  const fullPath = path.join(distDir, pathname.replace(/^\//, ''));
  const normalizedPath = path.normalize(fullPath);

  if (!normalizedPath.startsWith(distDir)) {
    return null;
  }

  return normalizedPath;
}

function getContentType(filePath) {
  return contentTypes.get(path.extname(filePath)) || 'application/octet-stream';
}

function sendNotFound(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not Found');
}

function sendMethodNotAllowed(response) {
  response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Method Not Allowed');
}

async function serveFile(request, response) {
  if (!['GET', 'HEAD'].includes(request.method || '')) {
    sendMethodNotAllowed(response);
    return;
  }

  const resolvedPath = resolvePath(request.url || '/');
  if (!resolvedPath || !(await pathExists(resolvedPath))) {
    sendNotFound(response);
    return;
  }

  const acceptEncoding = String(request.headers['accept-encoding'] || '');
  const extension = path.extname(resolvedPath);
  let servedPath = resolvedPath;
  let contentEncoding = null;

  if (compressibleExtensions.has(extension) && acceptEncoding.includes('br') && await pathExists(`${resolvedPath}.br`)) {
    servedPath = `${resolvedPath}.br`;
    contentEncoding = 'br';
  } else if (compressibleExtensions.has(extension) && acceptEncoding.includes('gzip') && await pathExists(`${resolvedPath}.gz`)) {
    servedPath = `${resolvedPath}.gz`;
    contentEncoding = 'gzip';
  }

  const headers = {
    'Content-Type': getContentType(resolvedPath),
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  };

  if (contentEncoding) {
    headers['Content-Encoding'] = contentEncoding;
    headers.Vary = 'Accept-Encoding';
  }

  response.writeHead(200, headers);

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(servedPath).pipe(response);
}

async function main() {
  if (!(await pathExists(distDir))) {
    console.error('dist directory not found. Run npm run build first.');
    process.exit(1);
  }

  const server = http.createServer((request, response) => {
    void serveFile(request, response).catch((error) => {
      console.error(error);
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Internal Server Error');
    });
  });

  server.listen(port, () => {
    console.log(`Preview server running at http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
