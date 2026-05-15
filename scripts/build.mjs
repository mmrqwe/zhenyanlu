import { transform } from 'esbuild';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const sourceJsDir = path.join(rootDir, 'js');
const rootAssets = ['bg.jpg', 'favicon.svg'];
const compressibleExtensions = new Set(['.html', '.js', '.css', '.svg', '.txt', '.json', '.map']);

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureParentDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function collectFiles(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

async function writeFile(filePath, content) {
  await ensureParentDirectory(filePath);
  await fs.writeFile(filePath, content);
}

async function copyRootAssets() {
  for (const relativePath of rootAssets) {
    const sourcePath = path.join(rootDir, relativePath);
    if (!(await pathExists(sourcePath))) {
      continue;
    }

    const destinationPath = path.join(distDir, relativePath);
    await ensureParentDirectory(destinationPath);
    await fs.copyFile(sourcePath, destinationPath);
  }
}

async function minifyHtml() {
  const sourcePath = path.join(rootDir, 'index.html');
  let html = await fs.readFile(sourcePath, 'utf8');
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);

  if (styleMatch) {
    const result = await transform(styleMatch[1], {
      loader: 'css',
      minify: true,
      legalComments: 'none',
    });
    html = html.replace(styleMatch[0], `<style>${result.code.trim()}</style>`);
  }

  html = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .trim();

  await writeFile(path.join(distDir, 'index.html'), `${html}\n`);
}

async function minifyJavaScriptModules() {
  const filePaths = await collectFiles(sourceJsDir);

  for (const filePath of filePaths) {
    const relativePath = path.relative(rootDir, filePath);
    const destinationPath = path.join(distDir, relativePath);

    if (path.extname(filePath) !== '.js') {
      await ensureParentDirectory(destinationPath);
      await fs.copyFile(filePath, destinationPath);
      continue;
    }

    const source = await fs.readFile(filePath, 'utf8');
    const result = await transform(source, {
      loader: 'js',
      format: 'esm',
      target: 'es2020',
      minify: true,
      legalComments: 'none',
    });

    await writeFile(destinationPath, `${result.code.trimEnd()}\n`);
  }
}

function compressBuffer(buffer) {
  return {
    gzip: gzipSync(buffer, { level: 9 }),
    brotli: brotliCompressSync(buffer, {
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      },
    }),
  };
}

async function createCompressedAssets() {
  const filePaths = await collectFiles(distDir);
  let gzipCount = 0;
  let brotliCount = 0;

  for (const filePath of filePaths) {
    const extension = path.extname(filePath);
    if (!compressibleExtensions.has(extension) || filePath.endsWith('.gz') || filePath.endsWith('.br')) {
      continue;
    }

    const source = await fs.readFile(filePath);
    const { gzip, brotli } = compressBuffer(source);

    if (gzip.length < source.length) {
      await fs.writeFile(`${filePath}.gz`, gzip);
      gzipCount += 1;
    }

    if (brotli.length < source.length) {
      await fs.writeFile(`${filePath}.br`, brotli);
      brotliCount += 1;
    }
  }

  return { gzipCount, brotliCount };
}

async function main() {
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });
  await minifyHtml();
  await minifyJavaScriptModules();
  await copyRootAssets();
  await fs.writeFile(path.join(distDir, '.nojekyll'), '');
  const { gzipCount, brotliCount } = await createCompressedAssets();
  console.log(`Built dist with minified modules, ${gzipCount} gzip assets, and ${brotliCount} brotli assets.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
