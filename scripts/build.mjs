// Builds the static blog into /dist/blog. Stops with an error if any post breaks a rule,
// so a bad post never replaces the live site.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { ROOT, config, escapeHtml as e, loadAndValidate, report } from './lib.mjs';

const BASE = config.basePath; // "/blog"
const SITE = config.siteUrl; // "https://claraai.tech"
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, BASE);

const posts = loadAndValidate();
if (!report(posts)) process.exit(1);
posts.sort((a, b) => (a.meta.date < b.meta.date ? 1 : a.meta.date > b.meta.date ? -1 : a.meta.slug.localeCompare(b.meta.slug)));

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });

const css = fs.readFileSync(path.join(ROOT, 'scripts', 'styles.css'), 'utf8');
const cssFile = `blog.${crypto.createHash('sha1').update(css).digest('hex').slice(0, 8)}.css`;
fs.writeFileSync(path.join(OUT, 'assets', cssFile), css);

// The logo master is huge, and the page shows it at most 32px tall, so ship a 96px-tall (3x) copy.
const logoBuf = await sharp(path.join(ROOT, config.logoFile)).resize({ height: 96 }).webp({ quality: 90 }).toBuffer();
const logoFile = `logo.${crypto.createHash('sha1').update(logoBuf).digest('hex').slice(0, 8)}.webp`;
fs.writeFileSync(path.join(OUT, 'assets', logoFile), logoBuf);
const logoMeta = await sharp(logoBuf).metadata();

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const niceDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const postUrl = (slug) => `${SITE}${BASE}/${slug}/`;
const postPath = (slug) => `${BASE}/${slug}/`;
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

function head({ title, description, canonical, image, imageAlt, type, extra = '' }) {
  const ga = config.gaId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${config.gaId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${config.gaId}');</script>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#070312">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${e(config.siteName)}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${canonical}">
${image ? `<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${e(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${image}">` : '<meta name="twitter:card" content="summary">'}
<meta name="twitter:title" content="${e(title)}">
<meta name="twitter:description" content="${e(description)}">
<link rel="alternate" type="application/rss+xml" title="${e(config.siteName)} Blog" href="${SITE}${BASE}/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${BASE}/assets/${cssFile}">
${extra}
${ga}
</head>`;
}

const logo = (h) => `<img src="${BASE}/assets/${logoFile}" alt="${e(config.siteName)}" width="${Math.round((logoMeta.width * h) / logoMeta.height)}" height="${h}">`;
const navLinks = () => config.nav.map((n) => `<a href="${n.href}"${n.href === `${BASE}/` ? ' aria-current="page"' : ''}>${e(n.label)}</a>`).join('\n      ');

// Same header as the homepage: logo, five links, white button. The phone menu needs no JavaScript.
const siteHeader = () => `<header class="site">
  <div class="in">
    <a class="logo" href="${SITE}/" aria-label="${e(config.siteName)} home">${logo(32)}</a>
    <nav class="desktop" aria-label="Main">
      ${navLinks()}
    </nav>
    <a class="pill cta-desktop" href="${config.ctaUrl}" target="_blank" rel="noopener">Book a strategy call</a>
    <details class="menu">
      <summary aria-label="Menu">
        <svg class="bars" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </summary>
      <nav aria-label="Main">
      ${navLinks()}
      <a class="pill" href="${config.ctaUrl}" target="_blank" rel="noopener">Book a strategy call</a>
      </nav>
    </details>
  </div>
</header>`;

const footer = () => `<footer class="site">
  <div class="in">
    <a href="${SITE}/" aria-label="${e(config.siteName)} home">${logo(24)}</a>
    <div class="tag">
      <span>${e(config.footerTaglines[0])}</span>
      <span class="extra">&bull;</span>
      <span class="extra">${e(config.footerTaglines[1])}</span>
    </div>
  </div>
</footer>`;

const card = (p, tag = 'h2', featured = false) => `<article class="card${featured ? ' featured' : ''}">
  <a class="img" href="${postPath(p.meta.slug)}" tabindex="-1" aria-hidden="true"><img src="${postPath(p.meta.slug)}images/${p.meta.hero.file}" alt="" width="${p.heroSize.width}" height="${p.heroSize.height}" loading="lazy"></a>
  <div class="in">
    <p class="cat">${e(p.meta.category)}</p>
    <${tag}><a href="${postPath(p.meta.slug)}">${e(p.meta.title)}</a></${tag}>
    <p>${e(p.meta.description)}</p>
    <time datetime="${p.meta.date}">${niceDate(p.meta.date)}</time>${featured ? `\n    <a class="pill read" href="${postPath(p.meta.slug)}">Read the guide</a>` : ''}
  </div>
</article>`;

function renderPost(p) {
  const m = p.meta;
  const url = postUrl(m.slug);
  const role = config.authors[m.author]?.role;
  const ogImage = `${url}og.jpg`;
  const body = p.body
    .replace(/(<img\b[^>]*\ssrc=")images\//gi, `$1${postPath(m.slug)}images/`)
    .replace(/<table\b[\s\S]*?<\/table>/gi, (t) => `<div class="table-wrap">${t}</div>`)
    .replace(/<a\b([^>]*href="https:\/\/(?!claraai\.tech)[^"]*"[^>]*)>/gi, (tag, inner) =>
      /\srel=/.test(inner) ? tag : `<a${inner.replace(/\starget="[^"]*"/, '')} target="_blank" rel="noopener">`);
  const cta = m.cta || config.defaultCta;
  const others = posts.filter((x) => x !== p).slice(0, 3);

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      headline: m.title,
      description: m.description,
      image: [ogImage, `${url}images/${m.hero.file}`],
      datePublished: `${m.date}T00:00:00+05:30`,
      dateModified: `${m.updated || m.date}T00:00:00+05:30`,
      author: { '@type': 'Person', name: m.author, ...(role ? { jobTitle: role } : {}), url: `${SITE}/` },
      publisher: { '@type': 'Organization', name: config.siteName, url: `${SITE}/` },
      keywords: m.keyword,
      wordCount: p.words,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: m.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}${BASE}/` },
        { '@type': 'ListItem', position: 3, name: m.title, item: url },
      ],
    },
  ];

  return `${head({
    title: `${m.title} | ${config.siteName}`,
    description: m.description,
    canonical: url,
    image: ogImage,
    imageAlt: m.hero.alt,
    type: 'article',
    extra: `<meta property="article:published_time" content="${m.date}T00:00:00+05:30">
<meta property="article:modified_time" content="${m.updated || m.date}T00:00:00+05:30">
<meta name="author" content="${e(m.author)}">
<link rel="preload" as="image" href="${postPath(m.slug)}images/${m.hero.file}">
${schema.map(jsonLd).join('\n')}`,
  })}
<body>
${siteHeader()}
<main>
<article>
  <div class="band post">
    <div class="in">
      <p class="crumbs"><a href="${SITE}/">Home</a> &nbsp;/&nbsp; <a href="${BASE}/">Blog</a></p>
      <p class="eyebrow">${e(m.category)}</p>
      <h1>${e(m.title)}</h1>
      <p class="byline">By <strong>${e(m.author)}</strong>${role ? `, ${e(role)}` : ''} &nbsp;&middot;&nbsp; <time datetime="${m.date}">${niceDate(m.date)}</time>${m.updated && m.updated !== m.date ? ` &nbsp;&middot;&nbsp; Updated <time datetime="${m.updated}">${niceDate(m.updated)}</time>` : ''}</p>
    </div>
  </div>
  <div class="page">
    <div class="hero">
      <img src="${postPath(m.slug)}images/${m.hero.file}" alt="${e(m.hero.alt)}" width="${p.heroSize.width}" height="${p.heroSize.height}" fetchpriority="high">
    </div>

${body}

    <section id="faq">
      <h2>${e(m.faq_heading || 'Frequently asked questions')}</h2>
${m.faqs.map((f) => `      <div class="faq-item">\n        <h3>${e(f.q)}</h3>\n        <p>${e(f.a)}</p>\n      </div>`).join('\n')}
    </section>
${m.sources.length ? `
    <section class="sources">
      <h2>Sources</h2>
      <ul>
${m.sources.map((s) => `        <li><a href="${e(s)}" target="_blank" rel="noopener">${e(s)}</a></li>`).join('\n')}
      </ul>
    </section>` : ''}

    <aside class="cta-box">
      <h2>${e(cta.heading)}</h2>
      <p>${e(cta.text)}</p>
      <div class="btns">
        <a class="pill lg" href="${config.ctaUrl}" target="_blank" rel="noopener">Book a strategy call</a>
        <a class="pill lg ghost" href="mailto:${config.contactEmail}">${e(config.contactEmail)}</a>
      </div>
    </aside>
  </div>
</article>
${others.length ? `
<section class="more">
  <div class="in">
    <p class="label">Keep reading</p>
    <h2>More from the ${e(config.siteName)} blog</h2>
    <div class="cards">
${others.map((x) => card(x, 'h3')).join('\n')}
    </div>
  </div>
</section>` : ''}
</main>
${footer()}
</body>
</html>
`;
}

function renderIndex() {
  const url = `${SITE}${BASE}/`;
  const first = posts[0];
  return `${head({
    title: config.blogTitle,
    description: config.blogDescription,
    canonical: url,
    image: first ? `${postUrl(first.meta.slug)}og.jpg` : null,
    imageAlt: first ? first.meta.hero.alt : '',
    type: 'website',
    extra: jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: `${config.siteName} Blog`,
      url,
      description: config.blogDescription,
      publisher: { '@type': 'Organization', name: config.siteName, url: `${SITE}/` },
      blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.meta.title, url: postUrl(p.meta.slug), datePublished: p.meta.date })),
    }),
  })}
<body class="dark">
${siteHeader()}
<main>
  <div class="band index">
    <div class="in">
      <p class="eyebrow">${e(config.siteName)} Blog</p>
      <h1>${e(config.blogHeading.plain)} <span class="grad">${e(config.blogHeading.gradient)}</span></h1>
      <p class="lede">${e(config.blogDescription)}</p>
    </div>
  </div>
  <div class="listing">
    <div class="cards">
${posts.map((p, i) => card(p, 'h2', i === 0)).join('\n') || '      <p>No posts yet.</p>'}
    </div>
  </div>
</main>
${footer()}
</body>
</html>
`;
}

// ---- write pages ----
for (const p of posts) {
  const dir = path.join(OUT, p.meta.slug);
  fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
  fs.cpSync(path.join(p.dir, 'images'), path.join(dir, 'images'), { recursive: true });
  // Share image: LinkedIn and some chat apps do not show WebP previews, so make a 1200x630 JPG.
  await sharp(path.join(p.dir, 'images', p.meta.hero.file))
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(dir, 'og.jpg'));
  fs.writeFileSync(path.join(dir, 'index.html'), renderPost(p));
}
fs.writeFileSync(path.join(OUT, 'index.html'), renderIndex());

// ---- sitemap, feed, list for the bot ----
const lastmod = (p) => p.meta.updated || p.meta.date;
const newest = posts.map(lastmod).sort().pop();
fs.writeFileSync(
  path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}${BASE}/</loc>${newest ? `<lastmod>${newest}</lastmod>` : ''}</url>
${posts.map((p) => `  <url><loc>${postUrl(p.meta.slug)}</loc><lastmod>${lastmod(p)}</lastmod></url>`).join('\n')}
</urlset>
`,
);
fs.writeFileSync(
  path.join(OUT, 'feed.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${e(config.siteName)} Blog</title>
  <link>${SITE}${BASE}/</link>
  <description>${e(config.blogDescription)}</description>
  <language>en</language>
  <atom:link href="${SITE}${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
${posts
  .slice(0, 30)
  .map((p) => `  <item>
    <title>${e(p.meta.title)}</title>
    <link>${postUrl(p.meta.slug)}</link>
    <guid isPermaLink="true">${postUrl(p.meta.slug)}</guid>
    <pubDate>${new Date(`${p.meta.date}T00:00:00+05:30`).toUTCString()}</pubDate>
    <description>${e(p.meta.description)}</description>
  </item>`)
  .join('\n')}
</channel>
</rss>
`,
);
// Machine-readable list of what is live, so the bot can avoid repeating topics and can link between posts.
fs.writeFileSync(
  path.join(OUT, 'posts.json'),
  JSON.stringify(posts.map((p) => ({ title: p.meta.title, slug: p.meta.slug, url: postUrl(p.meta.slug), keyword: p.meta.keyword, category: p.meta.category, date: p.meta.date })), null, 2),
);

// The project's own address only exists to feed claraai.tech/blog, so send stray visitors there.
const bounce = `<!doctype html><meta charset="utf-8"><title>${e(config.siteName)} Blog</title><link rel="canonical" href="${SITE}${BASE}/"><meta http-equiv="refresh" content="0; url=${BASE}/"><a href="${BASE}/">${e(config.siteName)} Blog</a>`;
fs.writeFileSync(path.join(DIST, 'index.html'), bounce);
fs.writeFileSync(path.join(DIST, '404.html'), `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found | ${e(config.siteName)}</title><link rel="stylesheet" href="${BASE}/assets/${cssFile}"><body class="dark"><div class="band index"><div class="in"><h1>Page not found</h1><p class="lede"><a class="pill" href="${BASE}/">Back to the blog</a></p></div></div>`);

console.log(`\nBuilt ${posts.length} post(s) into dist${BASE}/`);
