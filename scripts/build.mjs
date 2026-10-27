// Builds the static blog into /dist/blog. Stops with an error if any post breaks a rule,
// so a bad post never replaces the live site.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import sharp from 'sharp';
import { ROOT, config, escapeHtml as e, loadAndValidate, report } from './lib.mjs';

const BASE = config.basePath; // "/blog"
const SITE = config.siteUrl; // "https://www.claraai.tech"
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

// Site design assets shared with the new claraai.tech design (font, star mark, wordmark, gradient).
fs.cpSync(path.join(ROOT, 'assets', 'site'), path.join(OUT, 'assets', 'site'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'assets', 'site', 'favicon.ico'), path.join(OUT, 'favicon.ico'));
fs.copyFileSync(path.join(ROOT, 'assets', 'site', 'favicon.ico'), path.join(DIST, 'favicon.ico'));
const A = `${BASE}/assets/site`;
// Blog CTAs go to the sales WhatsApp line with a [WEB-BLOG] source tag, same pattern as the main site.
// WhatsApp CTA goes to Clara (the WhatsApp Agent). Each post carries its own source tag [WEB-BLOG-<slug>];
// the index and other pages use [WEB-BLOG]. The template lives in site.config.json (ctaUrl, {tag} placeholder).
let ctaTag = 'WEB-BLOG';
const waUrl = (tag) => (config.ctaUrl || 'https://wa.me/919549549339?text={text}').replace('{text}', encodeURIComponent((config.ctaText || "Hi Clara, I read your blog post and I'd like a free demo [{tag}]").replace('{tag}', tag)));
const WA_ = () => waUrl(ctaTag);
const NAV = [
  ['Solutions', `${SITE}/#solutions`],
  ['Case studies', `${SITE}/#case-studies`],
  ['LinkedIn Agent', `${SITE}/ai-linkedin-outreach-agent`],
  ['SEO Agent', `${SITE}/ai-seo-agent`],
  ['Blog', `${SITE}/blog/`],
  ['Contact', `${SITE}/#contact`],
];
const FOOT = [
  ['Clara AI home', `${SITE}/`],
  ['AI Virtual Employees', `${SITE}/#ai-virtual-employees`],
  ['AI LinkedIn Outreach Agent', `${SITE}/ai-linkedin-outreach-agent`],
  ['AI SEO Agent', `${SITE}/ai-seo-agent`],
  ['AI Calling Agents', `${SITE}/ai-calling-agents`],
  ['AI Chatbots', `${SITE}/ai-chatbots`],
  ['AI Dashboards', `${SITE}/ai-dashboards`],
  ['Custom AI Agents', `${SITE}/custom-ai-agents`],
  ['Blog', `${SITE}/blog/`],
];
// Same service tiles as the main site's phone menu.
const SVC = [
  ['AI LinkedIn Outreach Agent', `${SITE}/ai-linkedin-outreach-agent`],
  ['AI SEO Agent', `${SITE}/ai-seo-agent`],
  ['AI Chatbots', `${SITE}/ai-chatbots`],
  ['AI Calling Agents', `${SITE}/ai-calling-agents`],
  ['AI Dashboards', `${SITE}/ai-dashboards`],
  ['Custom AI Agents', `${SITE}/custom-ai-agents`],
];
const arrow = '<svg class="arr" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const waBtn = (label = 'Book a free demo', cls = 'btn-primary') => `<a class="btn ${cls}" href="${WA_()}" target="_blank" rel="noopener" data-hide-float>${label}${arrow}</a>`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const niceDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const postUrl = (slug) => `${SITE}${BASE}/${slug}/`;
const postPath = (slug) => `${BASE}/${slug}/`;
const ORG = { '@type': 'Organization', name: config.siteName, url: `${SITE}/`, logo: { '@type': 'ImageObject', url: `${SITE}${BASE}/assets/${logoFile}`, width: logoMeta.width, height: logoMeta.height }, ...(Array.isArray(config.sameAs) && config.sameAs.length ? { sameAs: config.sameAs } : {}) };
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

function head({ title, description, canonical, image, imageAlt, type, extra = '' }) {
  const ga = config.gaId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${config.gaId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${config.gaId}');document.addEventListener('click',function(ev){var a=ev.target&&ev.target.closest&&ev.target.closest('a,button');if(!a)return;var h=a.getAttribute('href')||'';var t=(a.innerText||a.textContent||'').trim().replace(/\\s+/g,' ').slice(0,100);if(/wa\\.me|whatsapp\\.com/i.test(h)||/book a free demo|interested/i.test(t)){if(typeof gtag==='function')gtag('event','demo_click',{button_text:t,page_location:location.href,link_url:h,transport_type:'beacon'});}},true);</script>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0C0828">
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
<link rel="icon" href="${BASE}/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="${BASE}/assets/site/favicon-32x32.png">
<link rel="preload" href="${BASE}/assets/site/OverusedGrotesk-VF.woff2" as="font" type="font/woff2" crossorigin>
<style>@font-face{font-family:"Overused Grotesk";src:url(${BASE}/assets/site/OverusedGrotesk-VF.woff2) format("woff2");font-weight:300 900;font-style:normal;font-display:swap}:root{--star:url(${BASE}/assets/site/star.svg)}</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:ital@1&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<link rel="stylesheet" href="${BASE}/assets/${cssFile}">
${extra}
${ga}
</head>`;
}

const wordmark = (h, cls = '') => `<img src="${A}/wordmark-white.svg" alt="${e(config.siteName)}" width="${Math.round(h * 125 / 40)}" height="${h}"${cls ? ` class="${cls}"` : ''}>`;

// Pill header, same links as the new claraai.tech. The phone menu is a <details>, so it needs no JavaScript.
const siteHeader = () => `<header class="pill">
  <div class="pill-bar">
    <a class="logo" href="${SITE}/" aria-label="${e(config.siteName)} home">${wordmark(30)}</a>
    <nav class="pill-links" aria-label="Main">
      ${NAV.map(([t, h]) => `<a href="${h}"${h === `${SITE}/blog/` ? ' aria-current="page"' : ''}>${e(t)}</a>`).join('\n      ')}
    </nav>
    <div class="pill-end">
      <a class="btn btn-primary btn-sm head-cta" href="${WA_()}" target="_blank" rel="noopener">Book a free demo</a>
      <details class="menu">
        <summary aria-label="Open menu">
          <svg class="bars" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          <svg class="x" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </summary>
        <div class="menu-card">
          <nav aria-label="Mobile">
            ${NAV.map(([t, h]) => `<a class="big" href="${h}">${e(t)}${arrow}</a>`).join('\n            ')}
          </nav>
          <div class="svc-tiles">
            ${SVC.map(([t, h]) => `<a href="${h}">${e(t)}</a>`).join('\n            ')}
          </div>
          <a class="btn btn-light btn-block" href="${WA_()}" target="_blank" rel="noopener">Book a free demo${arrow}</a>
        </div>
      </details>
    </div>
  </div>
</header>`;

const footer = () => `<footer class="site sec-dark grain">
  <div class="bg" style="background-image:url(${A}/grad-4-sm.webp)"></div>
  <div class="wrap">
    <div class="foot-top">
      <div class="foot-copy">
        ${wordmark(40, 'foot-logo')}
        <p>An AI implementation team building AI virtual employees, calling agents, chatbots, dashboards and custom agents around your workflow. Trusted by 19 clients.</p>
      </div>
      ${waBtn('Book a free demo', 'btn-light')}
    </div>
    <nav class="foot-links" aria-label="Services">
      ${FOOT.map(([t, h]) => `<a href="${h}">${e(t)}</a>`).join('\n      ')}
    </nav>
    <p class="copy">&copy; ${new Date().getFullYear()} Clara AI. SNB Future Drive Pvt Ltd.</p>
  </div>
</footer>
<a class="wa-float" href="${WA_()}" target="_blank" rel="noopener" aria-label="Chat with Clara AI on WhatsApp" title="Chat with us on WhatsApp"><svg width="30" height="30" viewBox="0 0 32 32" fill="#fff" aria-hidden="true"><path d="M16.04 3C9.4 3 4 8.36 4 14.97c0 2.11.56 4.17 1.62 5.99L4 29l8.27-2.15a12.1 12.1 0 0 0 3.77.6C22.68 27.45 28 22.08 28 15.47 28 8.86 22.68 3 16.04 3zm0 22.4c-1.2 0-2.38-.2-3.5-.6l-.25-.09-4.9 1.28 1.3-4.75-.16-.25A9.86 9.86 0 0 1 6.1 14.97c0-5.47 4.46-9.92 9.94-9.92 5.47 0 9.92 4.6 9.92 10.42 0 5.47-4.45 9.93-9.92 9.93zm5.45-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.71.23 1.36.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/></svg></a>
<script>(function(){var f=document.querySelector('.wa-float');if(!f||typeof IntersectionObserver==='undefined')return;var seen=new Set();var io=new IntersectionObserver(function(es){es.forEach(function(x){x.isIntersecting?seen.add(x.target):seen.delete(x.target)});f.classList.toggle('hide',seen.size>0)},{rootMargin:'-55% 0px 0px 0px'});document.querySelectorAll('[data-hide-float],.cta-mid,.cta-box').forEach(function(el){io.observe(el)});})();</script>`;

const card = (p, tag = 'h2', featured = false) => `<article class="card${featured ? ' featured' : ''}">
  <a class="img" href="${postPath(p.meta.slug)}" tabindex="-1" aria-hidden="true"><img src="${postPath(p.meta.slug)}images/${p.meta.hero.file}" alt="${e(p.meta.title)}" width="${p.heroSize.width}" height="${p.heroSize.height}" loading="${featured ? 'eager' : 'lazy'}"${featured ? ' fetchpriority="high"' : ''}></a>
  <div class="in">
    <p class="cat">${e(p.meta.category)}</p>
    <${tag}><a href="${postPath(p.meta.slug)}">${e(p.meta.title)}</a></${tag}>
    <p class="ex">${e(p.meta.description)}</p>
    <time datetime="${p.meta.date}">${niceDate(p.meta.date)}</time>
  </div>
</article>`;

function renderPost(p) {
  const m = p.meta;
  ctaTag = `WEB-BLOG-${m.slug}`;
  const url = postUrl(m.slug);
  const role = config.authors[m.author]?.role;
  const ogImage = `${url}og.jpg`;
  const bodyRaw = p.body
    .replace(/(<img\b[^>]*\ssrc=")images\//gi, `$1${postPath(m.slug)}images/`)
    .replace(/<table\b[\s\S]*?<\/table>/gi, (t) => `<div class="table-wrap">${t}</div>`)
    .replace(/href="https:\/\/claraai\.tech(?=[\/"#])/gi, `href="${SITE}`)
    .replace(/<a\b([^>]*href="https:\/\/(?!(?:www\.)?claraai\.tech)[^"]*"[^>]*)>/gi, (tag, inner) =>
      /\srel=/.test(inner) ? tag : `<a${inner.replace(/\starget="[^"]*"/, '')} target="_blank" rel="noopener">`);
  const cta = m.cta || config.defaultCta;
  // Mid-post call to action: goes in before the third h2 of the body (so after the second section).
  // Posts with fewer than three h2s get it before their last h2 instead.
  const midCta = `<aside class="cta-mid" aria-label="Book a free demo">
      <p class="cta-mid-text"><strong>See it working on your data.</strong> First demo within 7 days.</p>
      ${waBtn()}
    </aside>

`;
  const h2At = [...bodyRaw.matchAll(/<h2\b/gi)].map((x) => x.index);
  const midAt = h2At.length >= 3 ? h2At[2] : h2At.length >= 2 ? h2At[h2At.length - 1] : -1;
  const body = midAt >= 0 ? bodyRaw.slice(0, midAt) + midCta + bodyRaw.slice(midAt) : bodyRaw;
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
      publisher: ORG,
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
  <div class="band post sec-dark grain">
    <div class="bg" style="background-image:url(${A}/grad-4.webp)"></div>
    <div class="in">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE}/">Home</a><span aria-hidden="true">/</span><a href="${BASE}/">Blog</a></nav>
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
        ${waBtn('Book a free demo', 'btn-light')}
        <a class="btn btn-ghost" href="mailto:${config.contactEmail}">${e(config.contactEmail)}</a>
      </div>
    </aside>
  </div>
</article>
${others.length ? `
<section class="more">
  <div class="wrap">
    <p class="eyebrow">Keep reading</p>
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
  ctaTag = 'WEB-BLOG';
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
      publisher: ORG,
      blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.meta.title, url: postUrl(p.meta.slug), datePublished: p.meta.date })),
    }),
  })}
<body>
${siteHeader()}
<main>
  <div class="band index sec-dark grain">
    <div class="bg" style="background-image:url(${A}/grad-4.webp)"></div>
    <div class="in">
      <p class="eyebrow">${e(config.siteName)} Blog</p>
      <h1>${e(config.blogHeading.plain)} <span class="serif">${e(config.blogHeading.gradient)}</span></h1>
      <p class="lede">${e(config.blogDescription)}</p>
    </div>
  </div>
  <div class="listing">
    <section class="agents" aria-labelledby="agents-h">
      <h2 id="agents-h" class="eyebrow">Our AI agents</h2>
      <div class="agent-cards">
        <a class="agent-card" href="${SITE}/ai-linkedin-outreach-agent"><strong>AI LinkedIn Outreach Agent${arrow}</strong><span>Finds the right buyers on LinkedIn, sends invites and follow-ups, and reports replies to you on WhatsApp.</span></a>
        <a class="agent-card" href="${SITE}/ai-seo-agent"><strong>AI SEO Agent${arrow}</strong><span>Picks topics, writes and publishes blog posts every day, and tracks which pages bring you traffic.</span></a>
      </div>
    </section>
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
// lastmod = the newest of meta.updated, meta.date and the post folder's last git commit, so edits show up.
const gitDate = (slug) => { try { return execSync(`git log -1 --format=%cs -- posts/${slug}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
const lastmod = (p) => [p.meta.updated, p.meta.date, gitDate(p.meta.slug)].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '')).sort().pop();
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
fs.writeFileSync(path.join(DIST, '404.html'), `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found | ${e(config.siteName)}</title><link rel="stylesheet" href="${BASE}/assets/${cssFile}"><body><div class="band index sec-dark grain"><div class="bg" style="background-image:url(${BASE}/assets/site/grad-4.webp)"></div><div class="in"><h1>Page not found</h1><p class="lede"><a class="btn btn-light" href="${BASE}/">Back to the blog</a></p></div></div>`);

console.log(`\nBuilt ${posts.length} post(s) into dist${BASE}/`);
