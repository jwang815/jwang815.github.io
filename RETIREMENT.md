# Legacy GitHub Pages retirement

This repository retains its historical source and Git history. The Pages workflow now publishes only generated per-URL retirement pages from `_site`, never the old expedition copy.

On 2026-10-09 the old homepage, Socotra, About and company article all returned HTTP 200 with June 18 last-modified headers, correct current-site canonicals, and no redirect. CNAME was already present; it did not redirect these live pages.

GitHub Pages does not offer repository-configurable HTTP 301 rules. These are immediate HTML meta-refresh redirects, plus a canonical and accessible destination link; JavaScript preserves incoming query strings and fragments. They are not HTTP 301 responses. No domain, DNS, Pages permission or security setting has been changed. A true server-side redirect would require separate host configuration.

All 56 historical HTML paths have explicit mappings in scripts/redirect-routes.json. Each destination returned HTTP 200 at verification on 2026-10-09 (the dashboard may require sign-in). Historical home and Socotra aliases use their established canonicals; contact goes to the current inquiry page. Unknown URLs retain a useful noindex 404 rather than being redirected to the homepage.

Run `node test/redirects-test.mjs` to build and verify all mappings. The deployed artifact excludes historical scripts, customer interfaces and old article/itinerary text. Source files remain in Git for reversibility.

Search engines must recrawl the old URLs; publication is not evidence of immediate index removal. Search Console canonical selection was not accessible during this repair.
