// Serves /dist on http://localhost:4173 so a post can be checked in a browser before it is committed.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const DIST = path.join(ROOT, 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.json': 'application/json' };
const port = Number(process.env.PORT) || 4173;

http
  .createServer((req, res) => {
    let p = path.normalize(decodeURIComponent(req.url.split('?')[0]));
    let file = path.join(DIST, p);
    if (!file.startsWith(DIST)) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return res.writeHead(404, { 'content-type': 'text/html' }).end(fs.readFileSync(path.join(DIST, '404.html')));
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(fs.readFileSync(file));
  })
  .listen(port, () => console.log(`Preview: http://localhost:${port}/blog/`));
