// Shared helpers: loading posts and checking them against the rules.
// No dependencies, so `npm run validate` works before anything is installed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const POSTS_DIR = path.join(ROOT, 'posts');
export const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));

export const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const stripTags = (html) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

/** Width and height of a WebP file, read from its header. Returns null if it is not WebP. */
export function webpSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = b.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L') {
    const n = b.readUInt32LE(21);
    return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  return null;
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? m[1] : null;
};

export function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
    .map((d) => {
      const dir = path.join(POSTS_DIR, d.name);
      const post = { folder: d.name, dir, errors: [], meta: {}, body: '' };
      const metaFile = path.join(dir, 'meta.json');
      const bodyFile = path.join(dir, 'body.html');
      if (!fs.existsSync(metaFile)) post.errors.push('meta.json is missing');
      else {
        try {
          post.meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
        } catch (e) {
          post.errors.push(`meta.json is not valid JSON: ${e.message}`);
        }
      }
      if (!fs.existsSync(bodyFile)) post.errors.push('body.html is missing');
      else post.body = fs.readFileSync(bodyFile, 'utf8');
      return post;
    });
}

/** Adds every rule violation to post.errors. A post with errors stops the build. */
export function validatePost(post, allPosts) {
  const { meta: m, body, dir, folder } = post;
  const L = config.limits;
  const err = (msg) => post.errors.push(msg);
  if (post.errors.length) return post; // files missing or unreadable: nothing more to check

  // ---- meta.json ----
  for (const f of ['title', 'slug', 'description', 'date', 'author', 'category', 'keyword']) {
    if (typeof m[f] !== 'string' || !m[f].trim()) err(`meta.json: "${f}" is missing or empty`);
  }
  if (m.slug && m.slug !== folder) err(`meta.json: slug "${m.slug}" must equal the folder name "${folder}"`);
  if (m.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.slug)) err('meta.json: slug must be lowercase letters, numbers and hyphens only');
  if (m.title && m.title.length > L.titleMaxChars) err(`meta.json: title is ${m.title.length} characters, max is ${L.titleMaxChars}`);
  if (m.description && (m.description.length < L.descriptionMinChars || m.description.length > L.descriptionMaxChars))
    err(`meta.json: description is ${m.description.length} characters, must be ${L.descriptionMinChars} to ${L.descriptionMaxChars}`);
  if (m.title) {
    for (const name of config.clientNamesNotAllowedInTitles)
      if (m.title.toLowerCase().includes(name.toLowerCase())) err(`meta.json: client name "${name}" is not allowed in the title`);
    if (allPosts.some((p) => p !== post && p.meta.title && p.meta.title.toLowerCase() === m.title.toLowerCase()))
      err('meta.json: another post already has this title');
  }
  if (m.author && !config.authors[m.author]) err(`meta.json: author "${m.author}" is not listed in site.config.json`);
  for (const f of ['date', 'updated']) {
    if (m[f] === undefined) continue;
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(m[f]) && !Number.isNaN(Date.parse(m[f]));
    if (!ok) err(`meta.json: "${f}" must be a real date written as YYYY-MM-DD`);
    else if (Date.parse(m[f]) > Date.now() + 36 * 3600 * 1000) err(`meta.json: "${f}" (${m[f]}) is in the future`);
  }
  if (m.updated && m.date && m.updated < m.date) err('meta.json: "updated" is earlier than "date"');
  if (m.keyword && m.title && !m.title.toLowerCase().includes(m.keyword.toLowerCase()) && !stripTags(body).toLowerCase().includes(m.keyword.toLowerCase()))
    err('meta.json: the keyword does not appear in the title or the article');

  if (!Array.isArray(m.faqs) || m.faqs.length < L.minFaqs || m.faqs.length > L.maxFaqs)
    err(`meta.json: "faqs" must hold ${L.minFaqs} to ${L.maxFaqs} questions`);
  else
    m.faqs.forEach((f, i) => {
      if (!f || typeof f.q !== 'string' || typeof f.a !== 'string' || !f.q.trim() || !f.a.trim()) err(`meta.json: faqs[${i}] needs both "q" and "a"`);
      else {
        if (!f.q.trim().endsWith('?')) err(`meta.json: faqs[${i}].q must end with a question mark`);
        if (/<[a-z]/i.test(f.q + f.a)) err(`meta.json: faqs[${i}] must be plain text, no HTML`);
      }
    });
  if (!Array.isArray(m.sources)) err('meta.json: "sources" must be a list (it can be empty)');

  // ---- images ----
  const checkImage = (file, where, declared) => {
    if (!file || /[\\/]/.test(file.replace(/^images\//, ''))) return err(`${where}: image path "${file}" must be a file inside images/`);
    const name = file.replace(/^images\//, '');
    const full = path.join(dir, 'images', name);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*\.webp$/.test(name)) err(`${where}: "${name}" must be a lowercase-hyphenated .webp file name`);
    if (!fs.existsSync(full)) return err(`${where}: images/${name} does not exist`);
    const kb = fs.statSync(full).size / 1024;
    if (kb > L.imageMaxKB) err(`${where}: images/${name} is ${Math.round(kb)} KB, max is ${L.imageMaxKB} KB`);
    const size = webpSize(full);
    if (!size) return err(`${where}: images/${name} is not a real WebP file`);
    if (size.width > L.imageMaxWidth) err(`${where}: images/${name} is ${size.width}px wide, max is ${L.imageMaxWidth}px`);
    if (declared && (Number(declared.width) !== size.width || Number(declared.height) !== size.height))
      err(`${where}: images/${name} is ${size.width}x${size.height} but width/height say ${declared.width}x${declared.height}`);
    return size;
  };
  if (!m.hero || !m.hero.file || !m.hero.alt) err('meta.json: "hero" needs "file" and "alt"');
  else {
    const size = checkImage(m.hero.file, 'meta.json hero', m.hero.width ? m.hero : null);
    if (size) post.heroSize = size;
  }

  // ---- body.html ----
  for (const tag of ['html', 'head', 'body', 'style', 'script', 'link', 'meta', 'iframe', 'h1', 'form', 'header', 'footer', 'nav'])
    if (new RegExp(`<${tag}[\\s>]`, 'i').test(body)) err(`body.html: <${tag}> is not allowed (the template adds the page shell and the H1)`);
  if (/\sstyle\s*=/i.test(body)) err('body.html: inline style="" is not allowed, use the template classes');
  if (/\son[a-z]+\s*=/i.test(body)) err('body.html: event attributes such as onclick are not allowed');
  if (/data:image/i.test(body)) err('body.html: images must be files in images/, never pasted in as data:');
  if (/class="[^"]*(cta-box|topbar|faq-item|byline|eyebrow)/.test(body)) err('body.html: the CTA box, top bar, byline and FAQ section come from the template, remove them');
  if (!/^\s*<p[\s>]/.test(body)) err('body.html: must start with a <p> that answers the title directly');
  const h2s = [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((x) => stripTags(x[1]));
  if (h2s.length < L.minH2) err(`body.html: has ${h2s.length} H2 headings, needs at least ${L.minH2}`);
  const words = stripTags(body).split(' ').filter(Boolean).length;
  if (words < L.minWords) err(`body.html: ${words} words, needs at least ${L.minWords}`);
  post.words = words;

  const imgs = [...body.matchAll(/<img\b[^>]*>/gi)].map((x) => x[0]);
  if (imgs.length + 1 < L.minImages || imgs.length + 1 > L.maxImages) err(`post has ${imgs.length + 1} images including the hero, allowed range is ${L.minImages} to ${L.maxImages}`);
  for (const tag of imgs) {
    const src = attr(tag, 'src');
    if (!src || !src.startsWith('images/')) { err(`body.html: img src "${src}" must start with images/`); continue; }
    if (!attr(tag, 'alt')) err(`body.html: ${src} has no alt text`);
    const w = attr(tag, 'width'), h = attr(tag, 'height');
    if (!w || !h) err(`body.html: ${src} needs width and height attributes`);
    checkImage(src, 'body.html', w && h ? { width: w, height: h } : null);
  }
  const used = new Set([m.hero?.file, ...imgs.map((t) => (attr(t, 'src') || '').replace(/^images\//, ''))]);
  const imgDir = path.join(dir, 'images');
  if (fs.existsSync(imgDir)) for (const f of fs.readdirSync(imgDir)) if (!used.has(f)) err(`images/${f} is not used by the post, delete it`);

  // ---- links ----
  const site = new URL(config.siteUrl);
  const links = [...body.matchAll(/<a\b[^>]*>/gi)].map((x) => attr(x[0], 'href'));
  const external = new Set();
  for (const href of links) {
    if (!href) { err('body.html: a link has no href'); continue; }
    if (href.startsWith('mailto:')) continue;
    let u;
    try { u = new URL(href); } catch { err(`body.html: link "${href}" must be a full https:// address`); continue; }
    if (u.protocol !== 'https:') err(`body.html: link "${href}" must use https`);
    if (u.hostname === `www.${site.hostname}`) err(`body.html: link "${href}" must use ${site.hostname} without www`);
    else if (u.hostname !== site.hostname) external.add(href);
  }
  if (Array.isArray(m.sources)) {
    for (const href of external) if (!m.sources.includes(href)) err(`body.html links to ${href} but it is not listed in meta.json "sources"`);
    for (const s of m.sources) if (!external.has(s)) err(`meta.json: source ${s} is never linked in body.html`);
  }

  // ---- banned terms, anywhere ----
  const everything = `${JSON.stringify(m)}\n${body}`.toLowerCase();
  for (const term of config.bannedTerms) if (everything.includes(term.toLowerCase())) err(`banned term "${term}" appears in the post`);
  if (/www\.claraai\.tech/i.test(JSON.stringify(m))) err('meta.json: use claraai.tech without www');

  return post;
}

export function loadAndValidate() {
  const posts = loadPosts();
  posts.forEach((p) => validatePost(p, posts));
  return posts;
}

export function report(posts) {
  const bad = posts.filter((p) => p.errors.length);
  for (const p of posts) {
    if (p.errors.length) {
      console.error(`\n✗ ${p.folder}`);
      for (const e of p.errors) console.error(`   - ${e}`);
    } else console.log(`✓ ${p.folder} (${p.words} words)`);
  }
  if (bad.length) console.error(`\n${bad.length} post(s) failed. Nothing was published.`);
  return bad.length === 0;
}
