# Plan: make this repo agent-safe

This is a 63 MB static marketing site (407 tracked files, 57 HTML pages, 240 commits, no `package.json`). Agents already write most of it. The easy path today is copy-paste a 400–2,400 line HTML file, miss a sibling list, and ship. The rearchitecture below makes the easy path the right one. It is sized for this repo: one catalog, one template, one Node lint. Not a framework rewrite.

Nothing in this branch is merged, deployed, or paid.

## What Jason actually reviews

There are **61 PRs** in `jwang815/jwang815.github.io`. Every one is authored as `jwang815`. A search for `commenter:jwang815` and a pass over review threads on #3, #7, #22, #40, #41, #42, #52, and #61 found **zero human line comments from Jason**. The only line review in-repo is Codex on #61 (Pages concurrency). There are **no GitHub issues**.

His bar is the trail of corrections he merges, usually the same day:

| Standard | Where it shows up |
|---|---|
| Verify in a real browser, then publish the count | #41: 98 images, 0 broken, after a headless pass |
| Do not overpromise | #44: "Permits, visas, flights handled" → "Permits and transportation handled" |
| Copy must sound like a person | #22: rewrite philosophy + testimonials; specific names, imperfect speech |
| No invented departure dates | #12: every trip is year-round; cards show duration |
| Photos must be the named country | #37 Mongolia blog showed Kyoto, 3 minutes later; `e849e41` replaced 6 wrong-country images |
| Self-host images; third-party CDNs break | #41 (Wikipedia 403, Unsplash/GFW) |
| EN and 中文 ship together | #7 → #8 → #9; `c177266` CTAs then `0916e67` i18n the next day |
| Mobile layout is part of the change, not a follow-up | #48 7 minutes after #47 (Turkmenistan overflow); three nav-dropdown fixes on 2026-06-09 |
| Do not truncate a file and call it done | Pakistan restore; `da76440` CSS `url()` truncation; `1efc419` truncated `insights.js` |
| Explicit URL maps; preserve source; no blanket homepage redirect | #61 retirement; `test/redirects-test.mjs` covers all 56 paths |
| Say what the mechanism actually is | #61: HTML refresh, not HTTP 301; no DNS/permission changes |
| False positives and silent `except` are defects | #52 Hyatt monitor hardening |
| Keep the change small | Most merged PRs are one concern; he merges them in minutes |

Granola's last 30 days (free-plan limit) do not contain coding conventions for this site. The 2026-10-11 notes are about a different ratings/search product. The Waypoint ops note that does apply: AI may draft, a human verifies facts before anything customer-facing goes out.

## Architect review of recent commits

**Production and source are already two trees.** `ff8ebc3` (#61, 2026-10-09) keeps every historical HTML file and publishes only generated redirects from `_site`. That boundary is correct. The living site is still the product: 25 expedition directories, 2.68 MB of HTML, Vercel config, inquire form, dashboard, `api/*`. Agents keep editing the living tree as if it were the deploy tree, and keep editing the deploy tree as if it were the product.

**The June 9 dump is the failure mode in miniature.** Claude added 13 expeditions between 01:46 and 05:16 UTC (`d6318f7` … `253e805`), then spent the rest of the day fixing nav (`30c3bd3`, `f4647fc`, `5358b25`), then a "site-wide review," then inquiry CTAs that only know the previous 12 trips (`c177266` + `js/inquire-cta.js` `DESTS`). The next day: localize the CTAs, then two cache-bust commits (`d666ac1`, `92db6ef`) because `?v=` was updated on some pages and not others.

**50 commits in this repo are a fix for another commit less than 48 hours earlier.** The repeats, in order:

1. **Private allowlists.** `inquire-cta.js` still hardcodes 12 slugs. 13 advertised trips never get the sticky "Request Itinerary" button. Same class of bug as homepage cards, continent nav, sitemap, `llms.txt`, and credits — each list is hand-maintained.
2. **Unprovenanced images.** Filenames like `unsplash-1514558427911.jpg` carry no country. That is why Kyoto landed on the Mongolia post and why six wrong-country images needed a second audit.
3. **Untyped i18n.** 50 `window.__i18n = {…}` files, no shared key set. Libya still references `lb_day1_date` … `lb_day9_date` with no definitions. Lang stems do not match slugs (`maya` vs `maya-corridor`, `maghreb` vs `tunisia-algeria`, `centralasia` vs `central-asia`).
4. **Manual cache tokens.** Six live `?v=` values (`20260319`, `20260424`, `20260609`, `20260609c`, `20260609g`, `20260610b`). A content-addressed query string would have made `92db6ef` unnecessary.
5. **Copied chrome.** 31 distinct `<nav>` blobs, 32 `<footer>` blobs. A one-line email change is a 30-file hunt. #10 (admin@ → info@) only stayed consistent because a later grep would have been painful; it is still 170 occurrences.
6. **Two templates.** The June 9 batch links `/css/expedition.css`. The older 11 expedition pages still inline a full stylesheet. Agents pick a donor page at random.
7. **Oversized writes.** Homepage is 126 KB. Mongolia is 123 KB. Agents truncate, then "restore." `css/expedition.css` itself starts with a raw `picture{display:contents}` scrape.
8. **Scope in the wrong repo.** #50–#52 hotel monitor, #60 Claude-for-Legal plugins (`.claude/settings.json` still enables 12 legal plugins), #3 still-open draft "autonomous website agency" docs, dashboard + `/api/insights` + `/api/daily-brief` living next to brochure HTML. Each one taught the next agent that this folder is a junk drawer.
9. **Hosting as folklore.** CNAME deleted (#43) then required again; www→apex missed `/` (#45→#46); Pages vs Vercel vs retirement `_site` vs `vercel.json` redirects. Agents cannot see which host is truth.

`1c85588` reverting `ad20b15` ("Dashboard data refresh") is a one-line cache-buster revert. That is not architecture, but it is the same instinct: mutate a string and hope the right surface updates.

## Inverse pyramid

Effort goes here first:

```
  codebase (catalog, types, boundaries)
        static analysis (lint, tests, CI)
              short prose (AGENTS.md + one skill)
                    human review (facts, photos, tone)
```

### 1. Codebase — make the easy path correct

**1a. One expedition catalog.** Promote `data/expeditions.example.json` + `data/expeditions.schema.json` (this PR) to `data/expeditions.json` covering all 25 trips. Required fields already match the bugs: `id`, `path`, `langFile`, `continent`, `countries`, `priceUsd`, `days`, `inquire`, `heroImage`, `imageCountry`, `yearRound`.

Derive from that file, delete the private copies:

- `js/inquire-cta.js` `DESTS`
- homepage cards + continent nav (desktop and mobile)
- `sitemap.xml` living-site URLs
- `llms.txt` trip list
- related-expedition chips
- `scripts/redirect-routes.json` *only* for the living-site path of each trip; do not fold retirement policy into the catalog

Adding a trip becomes: one catalog row, one lang module, images whose names include the country, one generated page. Missing any of those fails lint.

**1b. One chrome, one template.** Extract `partials/nav.html` and `partials/footer.html`. Generate expedition pages from one template that always links `/css/expedition.css`. Keep handwritten HTML only for genuinely unique pages (homepage hero, about, inquire, dashboard). A 20-line `scripts/build-pages.mjs` is enough; there is no `package.json` and this site does not need Next.js, Astro, or a design system.

**1c. Image manifest.** `data/images.json`: path, country, subject, source (`wp-original` \| `licensed` \| `stock`). Ban `unsplash-*` as a filename. `imageCountry` must be in the trip's `countries`. That is the mechanical fix for Kyoto-on-Mongolia and the six wrong-country swaps.

**1d. Typed i18n.** Move each `lang/*.js` assignment to JSON `{key:{en,zh}}`. One stem per `id`. A page may only use keys from its module plus a shared `chrome` module (nav, footer, CTA). HTML `data-i18n` that is not in those modules is a lint error. Libya's nine missing `*_date` keys become unmergeable.

**1e. Content-hash cache bust.** Replace date tokens with a short hash of the file bytes, written by the same build that emits pages. `vercel.json` already caches `/css|js|lang/` for one day — hashed URLs make that safe.

**1f. Keep the retirement boundary.** `#61` is the one recent change that already has invariants (explicit maps, source preserved, unknown URLs stay 404, destinations must be `https://wpjourneys.com`). Do not generate `_site` from the living catalog. Do not put hotel monitors, legal plugins, or agency playbooks in this repo.

**1g. Split ops from the brochure if it grows again.** Dashboard + `api/*` + Apps Script already behave like a second app. If another ops feature is needed, it belongs in its own project. Until then, treat `/dashboard` and `/api` as a walled folder with no imports from expedition HTML.

### 2. Static analysis — catch the class, not the instance

This PR's `scripts/lint-site.mjs` already fails current `main` with **3 errors and 5 warnings** and no npm install:

```
ERROR 13 advertised trips have no working inquire CTA
ERROR libya-expedition/index.html uses 9 i18n key(s) missing from libya
ERROR asset ?v= is fragmented across 6 tokens
WARN  31 distinct <nav> blobs
WARN  32 distinct <footer> blobs
WARN  two expedition templates: 13 link expedition.css, 11 still inline
WARN  19 pages still reference unsplash-* filenames
WARN  lang stems do not match slugs
```

That is the whole Layer 2. Wire it into the existing `validate` job in `.github/workflows/pages.yml` (already runs `node test/redirects-test.mjs` on every PR; Codex already flagged that this job shares the `pages` concurrency group with deploy — split the group when wiring). Do not add paid scanners, Lighthouse CI subscriptions, or a second host.

Add a handful of Node tests next to the lint, same style as `test/redirects-test.mjs`:

- catalog validates against `data/expeditions.schema.json`
- every `id` has a page, a lang file, a hero image on disk
- every `inquire: true` page loads the CTA script
- every `data-i18n` key exists
- one `?v=` generation rule
- `redirect-routes.json` still covers every historical HTML path (already true)

Playwright stays optional and local (`.gitignore` already has `node_modules/` for it). Jason's successful UI reviews already name Playwright (`5358b25`, `0b119d3`). A five-route smoke (home, one old expedition, one June-9 expedition, `/inquire/?dest=ethiopia`, mobile nav) is enough. Do not put a browser download in the Pages deploy job.

### 3. Minimal prose

Write these only after 1 and 2 exist, so they point at machinery instead of substituting for it.

**`AGENTS.md`** — one screen:

- This repo is the living Waypoint brochure. Pages production publishes `_site` redirects; do not "fix" that by editing expedition copy into the workflow.
- Source of truth: `data/expeditions.json`. Do not add a trip by cloning HTML.
- Run `node scripts/lint-site.mjs` and `node test/redirects-test.mjs`. Both must pass.
- Do not add dependencies, paid services, legal plugins, monitors, or docs packs.
- Do not truncate a file. Do not invent prices, dates, or country photos.

**`.cursor/skills/verify-site/SKILL.md`** — the verification skill, also one screen:

- Desktop and 390px: home, one expedition, inquire submit path.
- Confirm the sticky CTA on that expedition (the June 9 hole).
- Toggle EN/中文 on a `data-i18n` string that is not a brand name.
- Confirm the hero is the named country.
- Paste the lint output, not a claim.

No other skills. #60 already proved extra plugins become clutter.

### 4. Human review — smallest slice

After the catalog and lint exist, Jason only needs to look at what lint cannot know:

- Price, duration, and what is actually included (the #44 class)
- Whether the hero is a real photo of that country
- Tone (the #22 class)
- Anything customer-facing that an LLM drafted (Granola: verify facts before send)

Not nav, sitemap, schema, i18n completeness, cache tokens, or CTA wiring. Those are machine checks. The current process inverts this: agents ship the mechanical work dirty, and Jason's "review" is a same-day fix PR.

## Open questions — prototyped, not deferred

| Question | Answer from this branch |
|---|---|
| Do we need a JS framework? | No. 57 HTML files, zero package manifest, one existing Node test. A catalog + 20-line generator matches the repo. |
| Will lint catch the common agent mistakes? | Yes. `node scripts/lint-site.mjs` reports the 13 missing CTAs, Libya's missing keys, and six cache tokens on current `main`. |
| Is a catalog schema expressible without guessing? | Yes. `data/expeditions.schema.json` + three real rows (Ethiopia $3,295 / 8 days, Socotra $2,950 / 7 days at `/socotra/`, Bangladesh $1,695 / 7 days). Hero files exist on disk. |
| Should retirement and the living site share a generator? | No. #61's invariant is "historical path → explicit destination." Mixing that with trip facts reintroduces blanket redirects. |
| Should this PR wire the lint into Pages CI? | Not yet. It fails on `main` (correctly). Wiring it is the first implementation PR, with the concurrency group split Codex already called out. This branch does not touch `.github/workflows/pages.yml`. |

## Sequence

1. Fill `data/expeditions.json` from the live pages; point `DESTS` and nav at it; re-run the lint until the 13 CTA misses are gone.
2. One template + shared chrome; delete the inlined stylesheet fork.
3. Rename `unsplash-*` and add `imageCountry`.
4. JSON i18n + hash cache bust.
5. Turn the prototype lint into the `validate` job; keep the retirement test.
6. Then, and only then, write the short `AGENTS.md` and verify-site skill.

Stop there. Do not migrate to a framework, do not deploy this branch, do not buy CI, do not merge until Jason wants the implementation PRs.
