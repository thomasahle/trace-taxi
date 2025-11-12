#!/usr/bin/env node
// Simple static file server that hosts the built app and exposes /api/trace to stream the JSONL file.
// Usage: view-trace <trace.jsonl> [--port 0]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import express from 'express';
import getPort from 'get-port';
import mime from 'mime';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDist() {
  // dist dir is at project root after "vite build"; cli is in cli/
  const candidate = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(candidate)) return candidate;
  console.error('Build artifacts not found. Run "npm run build" first.');
  process.exit(1);
}

function openInBrowser(url) {
  const platform = os.platform();
  const cmd = platform === 'darwin' ? 'open' :
              platform === 'win32' ? 'start' : 'xdg-open';
  // Use shell to ensure it finds the command
  const { exec } = require('node:child_process');
  exec(`${cmd} "${url}"`);
}

function parseArgs() {
  const args = process.argv.slice(2).filter(Boolean);
  if (args.length === 0) {
    console.error('Usage: view-trace <trace.jsonl>');
    process.exit(1);
  }
  const file = path.resolve(process.cwd(), args[0]);
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(1);
  }
  return { file };
}

async function main() {
  const { file } = parseArgs();
  const distDir = resolveDist();
  const app = express();

  // Serve static assets
  app.use(express.static(distDir, {
    setHeaders: (res, filePath) => {
      const type = mime.getType(filePath) || 'application/octet-stream';
      res.setHeader('Content-Type', type);
      res.setHeader('Cache-Control', 'no-cache');
    }
  }));

  // Endpoint serving the trace as text
  app.get('/api/trace', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    fs.createReadStream(file).pipe(res);
  });

  const port = await getPort({ port: 5173 });
  app.listen(port, () => {
    const url = `http://localhost:${port}/?file=/api/trace`;
    console.log('Trace Viewer on', url);
    // Fallback to manual paste if opener isn't available
    try {
      // dynamic import to avoid ESM/CommonJS issues for child_process
      import('node:child_process').then(({ exec }) => {
        const platform = process.platform;
        const cmd = platform === 'darwin' ? 'open' :
                    platform === 'win32' ? 'start' : 'xdg-open';
        exec(`${cmd} "${url}"`);
      });
    } catch (e) {
      console.log('Open this URL in your browser:', url);
    }
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});