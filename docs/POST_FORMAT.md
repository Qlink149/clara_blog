# Post format

One folder per post in `/posts`, named after the URL slug:

```
posts/ai-chatbot-for-jewellery-retail-lead-qualification/
   meta.json
   body.html
   images/
      hero.webp
      six-step-flow.webp
```

`npm run validate` checks every rule below. A post that breaks one is not published.

## meta.json

```json
{
  "title": "AI Chatbot for Jewellery Retail Lead Qualification",
  "slug": "ai-chatbot-for-jewellery-retail-lead-qualification",
  "description": "120 to 160 characters, includes the main keyword",
  "date": "2026-10-08",
  "author": "Yogansh Banthia",
  "category": "AI Chatbots · Jewellery Retail",
  "keyword": "ai chatbot for jewellery retail lead qualification",
  "hero": { "file": "hero.webp", "alt": "What the image shows", "width": 1600, "height": 900 },
  "faqs": [{ "q": "A question ending in a question mark?", "a": "Plain-text answer." }],
  "sources": ["https://example.org/the-page-a-statistic-came-from"]
}
```

| Field | Rule |
|-------|------|
| `title` | Max 65 characters. No client names. Unique. |
| `slug` | Same as the folder name. Lowercase letters, numbers, hyphens. |
| `description` | 120 to 160 characters. |
| `date` | `YYYY-MM-DD`, the real publish date, not in the future. |
| `author` | Must be listed in `site.config.json`. |
| `faqs` | 3 to 6. Plain text. Written here only, never in `body.html`. |
| `sources` | Every outside link in the body, and nothing else. |

Optional: `updated` (date of a later edit), `faq_heading`, `cluster` (`linkedin`, `seo` or `general`, to override the end-box cluster). An old `cta` field is ignored by the template; `cta.tag` is no longer used.

## Calls to action (added by the build)

Every WhatsApp button goes to `wa.me/919549549339` with the prefilled text from `site.config.json` (`ctaText`) and a source tag. The button always says **Book a free demo**. No other button text, no audit buttons, no prices, no "guarantee".

| Button | Tag |
|--------|-----|
| Header, phone menu, mid-post box, footer, floating WhatsApp | `[WEB-BLOG-<slug>]` |
| Any WhatsApp link inside `body.html` (the in-body proof box) | `[WEB-BLOG-<slug>-IN]`, rewritten by the build whatever the link says |
| End-of-post CTA box | `[WEB-BLOG-<slug>-END]` |
| Blog index | `[WEB-BLOG]` |

The end-of-post box is the same for every post in a cluster: a headline, three bullets (outcome, "we run it for you", one proof line), the button, and the line "Free demo, no obligation. If we're not a fit, we'll tell you." The text lives in `END_CTA` in `scripts/build.mjs`. The cluster comes from `meta.cluster`, else from the post's row in `topics.md` (keyword + notes), else from the slug and keyword: "linkedin" → LinkedIn Outreach Agent, "seo"/"geo"/AI search → SEO Agent, otherwise general AI agents. Proof lines are only these approved, dated figures:

- LinkedIn: Haique Surfaces, as of 21 Oct 2026: 345 reached, 107 accepted, 14 replies.
- SEO: Our own blog: organic sessions up 28% (10–25 Oct vs 24 Sep–9 Oct 2026).
- General: Clara AI builds AI agents for 19 businesses, including Hiranandani and Vijay Sales.

Do not write your own end CTA box in `body.html`. An optional in-body proof box uses `<aside class="proof-box">` followed by `<p class="proof-cta">` with a `btn btn-primary` WhatsApp link.

## body.html

The article only. It starts with a `<p>` that answers the title's question and ends
before the FAQs.

Allowed: `p`, `h2`, `h3`, `a`, `strong`, `em`, `ul`, `ol class="steps"`, `table`,
`blockquote`, `figure` with `img` and `figcaption`, and stat cards.

Not allowed: `html`, `head`, `style`, `script`, `link`, `h1`, inline `style=""`, the top
bar, the byline, the FAQ section, the CTA box. The template adds all of these.

- At least 3 `h2` headings, at least half written as questions a buyer would type.
- At least 600 words.
- Links to our site use `https://claraai.tech/...` without `www`.
- Every outside statistic links to the page it came from.

### Stat cards

Numbers go in stat cards, as real text, not inside pictures. Search engines and AI
assistants cannot read text inside an image.

```html
<div class="stats">
  <div class="stat"><strong>4-6 sec</strong><span>First reply time, down from 4-6 hours</span></div>
  <div class="stat"><strong>24%</strong><span>Complete a store-visit or callback request</span></div>
</div>
```

### Images

```html
<figure>
  <img src="images/six-step-flow.webp" alt="Six-step flow from first message to CRM entry" width="1600" height="900" loading="lazy">
</figure>
```

- WebP only, max 1600 px wide, max 150 KB each, 1 to 6 per post including the hero.
- Lowercase hyphenated file names. `alt`, `width` and `height` on every `img`.
- `width` and `height` must be the file's real size.
- No unused files in `images/`.
- The hero is set in `meta.json`, not in `body.html`. The share preview is made from it.
