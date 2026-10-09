# Changes to the main website repo (clara-web)

These two files make claraai.tech/blog show the blog project. Copy them into the
main website repo at the same paths, after the blog project is live on Vercel.

1. `frontend/vercel.json`: replace `REPLACE-WITH-BLOG-PROJECT` (twice) with the blog
   project's Vercel address, then commit. If the Vercel project's Root Directory is not
   `frontend`, put the file in that root directory instead.
2. `frontend/public/robots.txt`: commit as is. Today claraai.tech/robots.txt returns the
   homepage, so search engines have no robots file and no sitemap.

Test on a Vercel preview deployment before merging: open `/blog/` and one post on the
preview address and confirm the blog appears, not the homepage. This rewrite has not been
tested against the live project.

Also worth doing in the main site:
- Add a "Blog" link (`/blog/`) to the header and footer, so visitors and crawlers can reach it.
- In Vercel > Domains, make `www.claraai.tech` redirect to `claraai.tech`. Both answer today.
- Keep these two files when the site is rebuilt.
