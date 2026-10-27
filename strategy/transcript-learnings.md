# Transcript learnings: blog, SEO/GEO and landing pages (draft v1, 26 Oct 2026)

## 0. Sources, and what's missing
| # | Source | Date | Where | Used? |
|---|---|---|---|---|
| S1 | SEO/GEO video transcript (how SEO and AI search work) | 26 Oct 2026 | Pasted into Blog Bot's main chat | **READABLE (corrected 27 Oct 2026).** Saved at `/workspace/agent-org-plan/skills/sources/blog-bot_seo-geo.txt` (first 20,000 characters). Turned into the skill `seo-geo-content-playbook`, which every post and service page must follow. Landing-page lessons are in the skill `high-converting-landing-page`. |
| S2 | Yogansh's spoken notes on the landing pages (dark theme, plain language, proof and screenshots on top) | 26 Oct 2026 | Main chat, saved in memory | Yes (section B) |
| S3 | Our own SEO/GEO research (competitors, SERPs, site audit) | 13 Oct 2026 | `research/2026-10-13-seo-geo-strategy.md` | Yes (section A). This is our own research, not a transcript. |
| S4 | Product-page decisions: no prices, "Book a free demo", Clara's WhatsApp, LinkedIn + SEO as the core | 26 Oct 2026 | Memory / main chat | Yes |
| – | Fireflies meeting transcripts in agent-tools (other clients' landing pages, e.g. Aura/Goddess Glow Up) | various | /workspace/agent-tools | Not used. They aren't about Clara. |
| – | /workspace/uploads | – | doesn't exist | – |

Tags: [S1–S4] = the source the rule came from. [Suggestion] = my own idea, not from any source.

## A. Blog / SEO / GEO rules for every post
1. **Answer first.** The first paragraph answers the target query directly in 40–60 words. [S3]
2. **Question-style H2s**, matching how people ask. [S3]
3. **FAQ block of at least 5 Q&As with FAQPage schema.** Already built in, keep it. [S3]
4. **At least one comparison table** in comparison and cost posts. [S3]
5. **Topic clusters.** Each post belongs to one pillar: the LinkedIn Outreach Agent or the SEO Agent (others only occasionally). It links **up** to that product page and **across** to 2–3 sibling posts. [S3 + S4]
6. **Commercial formats win:** "X vs Y", cost guides, "best X for Y", alternatives, industry and country pages. Plain narrative posts rank less often. [S3]
7. **Concrete specifics** (steps, timelines, named rules) instead of generic copy. [S3]
8. **Freshness.** Set `updated` in meta.json when a post is revised (the build already emits dateModified), and show it. [S3]
9. **Entities and off-site mentions.** AI engines lean on third parties (Clutch, GoodFirms, G2, LinkedIn articles that link back). [S3]
10. **Tech:** canonicals, sitemap and robots on www; llms.txt; a real 404. [S3] *Check that these are still fixed.*
11. **One real screenshot per post**, blurred, approved by Yogansh, followed by a Clara WhatsApp CTA line. [S4]
12. Surfer/SEO-GEO tactics now live in the `seo-geo-content-playbook` skill (money pages first, one cluster at a time built bottom-up, answer in the first 40–60 words, FAQ with schema, refresh old posts, off-site mentions, monthly AI-answer checks). Follow that skill for every post.

## B. Landing / product page rules (LinkedIn Outreach Agent, SEO Agent)
1. **Plain, simple, direct words.** One idea per line, no jargon. [S2]
2. **Proof and real screenshots near the top**, in or right under the hero, not halfway down the page. [S2]
3. **Light theme**, not black: the off-white #FAF8F5 + Clara palette. [S2, palette from the blog rules]
4. **No prices.** One CTA everywhere, "Book a free demo", opening wa.me/919549549339 with a source tag ([WEB-LI] / [WEB-SEO]). [S4]
5. **Hero = outcome + how + what you don't have to do** (e.g. "Get replies from buyers on LinkedIn … every reply comes to your WhatsApp"). [S4 angle; wording is a suggestion]
6. **Future-of-work angle**: a person does this job in a browser and reports on WhatsApp; the agent does the same, and a human checks it. [S4]
7. **Handle objections** with short reassurance bullets under the CTA (free demo, live in 2 weeks, our team checks the agent, you stay in control) and a short FAQ. [Suggestion; v2 preview already does this]
8. **Length:** short sections (pain, proof, 3 steps, what you get, why us, FAQ, CTA). Repeat the CTA after the proof and at the end. [Suggestion]
9. **Blur names, numbers, phones and timestamps** in every screenshot; Yogansh approves each one. [S4]
10. Final design waits on Yogansh's research on high-converting examples. [S2]

## C. Gaps, ranked by expected impact (my judgement)
Checked: posts `daily-sales-report-automation` (26 Oct), `what-is-a-custom-ai-agent` (24 Oct), `ivr-vs-ai-voice-agent` (21 Oct), and `clara-web/frontend/src/agentPages.js` (v2 preview, read only).
1. **The posts don't target the core products yet.** All three are about dashboards, custom agents or calling. Internal links go to /ai-calling-agents, /ai-chatbots, /ai-dashboards and /custom-ai-agents, none to /ai-linkedin-outreach-agent or the SEO agent page.
2. **No real proof in the posts.** Both images in each post are generated diagrams, with no real screenshot or GA screenshot.
3. **The product pages aren't live** (v2 preview only), so the blog has no money page to link to.
4. **The answer-first opening is inconsistent.** The custom-agent post opens with a direct definition; the sales-report post gets there in its intro but then switches to a story; check every post.
5. **FAQ/sources are thin.** `sources` is empty in 2 of 3 posts. [Suggestion: cite 1–2 public sources per post]
6. **No comparison tables** in 2 of 3 posts (IVR has one).
7. **No `updated` dates.** Old posts are never refreshed.
8. **Preview flags:** the product page shows client numbers (Haique 345/107/14, Sanjeet 149/43/12/3). That's fine for product pages if Yogansh approved it from the decks, but these numbers must **not** be copied into blog posts (the no-client-numbers rule). Logos/names in "Trusted by 19 clients" need checking against the banned list (they look OK).
9. Off-site mentions (Clutch/G2/LinkedIn articles): not started.

## D. Daily 4 AM checklist
1. Topic from topics.md: LinkedIn Agent or SEO Agent pillar (calling posts only occasionally).
2. Opening paragraph answers the query in 40–60 words.
3. Question-style H2s; one comparison table where it fits.
4. FAQ with 5 Q&As; 1–2 public sources in `sources`.
5. Link up to the product page and across to 2–3 sibling posts.
6. One real, blurred, approved screenshot + a CTA line to Clara's WhatsApp ([WEB-BLOG-slug]).
7. CTA "Book a free demo" in the header, a mid-post box and the end; no prices.
8. No client numbers; no banned names; "Clara AI"; facts only from facts_sheet.md.
9. Images: own GenerateImage, #FAF8F5 + palette, spell-checked.
10. If an old post was edited, set `updated`.
11. Validate, build, push; send Yogansh the link + the screenshot the post needs.
