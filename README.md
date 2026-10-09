# Clara.ai blog

Static blog served at `claraai.tech/blog`. Each post is a folder in `/posts`; the build
wraps it in the site template and writes plain HTML pages.

## Commands

| Command | What it does |
|---------|--------------|
| `npm run validate` | Checks every post against the rules. Fails on any error. |
| `npm run build` | Validates, then builds the site into `dist/`. |
| `npm run preview` | Builds, then serves it at `http://localhost:4173/blog/`. |

## What is where

- `posts/` one folder per post (`meta.json`, `body.html`, `images/`)
- `docs/POST_FORMAT.md` the format every post must follow
- `docs/BOT_SETUP.md` the Bot description, skill and routine text
- `facts/approved-facts.md` the only client numbers a post may use
- `topics.md` the keyword backlog
- `site.config.json` site address, analytics ID, client names, banned terms, limits
- `scripts/` the build, the checks and the page design (`styles.css`)
- `main-site-changes/` two files to copy into the main website repo

## What the build produces

For each post: the page with title, description, canonical link, share-preview tags,
Article, FAQ and breadcrumb schema, and a 1200x630 JPG share image made from the hero.
Plus the blog index, `sitemap.xml`, `feed.xml` and `posts.json`.

## Going live (one time)

1. Create a GitHub repo named `clara-blog` and push this folder to it.
2. In Vercel, import that repo as a new project. No settings to change; `vercel.json` sets them.
3. Open the project's address and check `/blog/` shows the post.
4. Follow `main-site-changes/README.md` to connect it to `claraai.tech/blog`.
5. In Google Search Console, submit `https://claraai.tech/blog/sitemap.xml`.

After that, every push to `main` publishes. If a post breaks a rule, the build fails and
the last good version stays live.
