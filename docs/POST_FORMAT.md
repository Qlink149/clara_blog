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

Optional: `updated` (date of a later edit), `faq_heading`, `cta` (`heading` and `text`).

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
