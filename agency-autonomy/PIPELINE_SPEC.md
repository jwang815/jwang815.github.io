# Autonomous Website Agency Pipeline Spec

## 1) System Overview

Build this as an event-driven pipeline with one canonical CRM database.

Core agents:

1. **Lead Research Agent** - finds candidate businesses and audits site quality.
2. **Qualification Agent** - scores and prioritizes leads.
3. **Outreach Agent** - sends compliant cold email sequence and handles replies.
4. **Sales/Closer Agent** - converts positive replies to paid projects.
5. **Web Design Agent** - creates preview and full implementation.
6. **Client Success Agent** - post-sale communication, revision loop, retention.

Use a central state machine so each lead has exactly one stage at a time.

---

## 2) Data Model (minimum fields)

### `leads`

- `lead_id` (uuid)
- `business_name`
- `website_url`
- `city`, `state`
- `industry` (home services, legal, dental, med spa, etc.)
- `email`
- `phone`
- `source` (Google Maps, Yelp, Chamber directory, etc.)
- `site_health_score` (0-100)
- `commercial_intent_score` (0-100)
- `overall_score` (0-100)
- `status` (new, researched, qualified, contacted, replied, proposal, won, lost)
- `owner_name` (optional)
- `last_contacted_at`
- `do_not_contact` (bool)

### `opportunities`

- `opportunity_id`
- `lead_id`
- `offer_type` (single-page, multipage, blog migration, redesign + local SEO)
- `price_estimate`
- `deal_stage`
- `invoice_id`
- `payment_status`
- `assigned_designer_agent`
- `delivery_deadline`

### `artifacts`

- `lead_id`
- `blurred_preview_url`
- `full_preview_url`
- `proposal_url`
- `contract_url`
- `invoice_url`
- `final_handoff_docs_url`

---

## 3) Stage Gates and Automations

## Stage A: Lead Discovery

Trigger: scheduled daily job by market + niche.

Inputs:

- Google Maps categories + US cities
- Industry directories
- Existing referrals

Filters:

- Active business
- Has website
- No enterprise-level site (prioritize weak SMB sites)

Automation output:

- Insert into `leads` as `new`

## Stage B: Website Quality Audit

Run automated checks:

- Mobile friendliness
- Page speed proxy (LCP-ish checks)
- Visual quality heuristic (outdated layout, low contrast, broken nav, no CTA)
- Technical smell checks (missing SSL, broken forms, missing metadata)
- Conversion design checks (no booking CTA, weak trust signals, no reviews section)

Compute:

- `site_health_score`
- `commercial_intent_score`
- `overall_score = 0.6 * site_health_gap + 0.4 * commercial_intent`

Gate:

- If `overall_score >= threshold` and valid contact method => `qualified`
- Else archive

## Stage C: Prebuilt Preview Generation

For qualified leads:

1. Take snapshot of current site and extract brand cues.
2. Generate redesign concept (hero + primary CTA + services + proof section).
3. Produce:
   - `blurred_preview_url` (watermarked)
   - `full_preview_url` (private link)

Gate:

- If preview quality check passes, move to `contacted_pending_send`

## Stage D: Outreach Sequence

Email 1 (value + specific teardown insight + blurred preview)
Email 2 (follow-up with one quantified improvement idea)
Email 3 (breakup email + soft CTA)

Best-practice constraints:

- Domain warming and sender reputation controls
- Max daily send caps
- Rotate inboxes safely
- Mandatory unsubscribe text
- Suppression and bounce handling

Routing:

- Positive reply -> `sales_queue`
- Neutral/question -> `manual_or_ai_assist_queue`
- Negative/unsubscribe -> `do_not_contact=true`

## Stage E: Sales and Close

When positive reply received:

1. Send full demo link and short loom-style explanation.
2. Ask qualifying questions (timeline, pages, integrations, budget band).
3. Generate proposal + scope.
4. Send invoice (Stripe) with milestone terms.

Gate:

- `payment_status = paid` -> auto create `delivery_project`

## Stage F: Delivery

Web Design Agent creates:

- Sitemap
- Wireframe
- Final high-fidelity design
- Production build
- CMS/blog setup if required
- QA checklist pass

## Stage G: Launch + Client Success

Client chooses channel: WhatsApp, Telegram, or email.

Client Success Agent responsibilities:

- Kickoff and expectations
- Weekly progress update
- Revision queue management
- Launch coordination
- 14-day post-launch check-in
- Upsell path (SEO retainer, maintenance, landing pages)

---

## 4) Gaps to Solve (Critical)

1. **Legal/compliance risk**  
   You need explicit CAN-SPAM compliant headers, sender identity, and easy opt-out.

2. **Data quality risk**  
   Public directory data is noisy. Add email verification and role-account filtering.

3. **Deliverability risk**  
   Cold email fails without inbox rotation, SPF/DKIM/DMARC, warmup, and send throttling.

4. **Trust risk in messaging**  
   "I already designed your site" can feel deceptive if not true. Use transparent phrasing:
   "I drafted a concept redesign for your homepage."

5. **Scope creep risk**  
   Define packages and revision caps before taking payment.

6. **Handoff risk**  
   Require a structured project brief before transfer to design agent.

7. **DNS/hosting outage risk**  
   Every launch must include rollback records and cutover checklist.

8. **Support overload risk**  
   Client Success needs SLA rules, escalation paths, and channel ownership.

---

## 5) Suggested Tech Stack (pragmatic v1)

- **Orchestration:** n8n (or Make)
- **CRM + state:** Airtable or Supabase Postgres
- **Lead sourcing:** Google Maps API / SerpAPI + directory scrapers
- **Email:** Postmark / Instantly / Smartlead + verified domains
- **AI generation:** OpenAI + vision-capable screenshot audit model
- **Preview hosting:** Vercel/Netlify private links
- **Proposals + contracts:** PandaDoc or Documint + e-sign
- **Payments:** Stripe invoices + webhook to CRM
- **PM/Delivery:** Linear or ClickUp + GitHub + staging deploys
- **Comms:** Twilio WhatsApp, Telegram bot, or shared inbox email

---

## 6) KPI Dashboard (minimum)

- New leads/day
- Qualified lead rate
- Email deliverability rate
- Reply rate
- Positive reply rate
- Demo viewed rate
- Close rate
- Average project value
- Days from first email -> paid
- Launch success rate (no rollback)
- Client NPS or satisfaction score

---

## 7) Outreach Sequence Skeleton

### Email 1: personalized teardown + blurred preview

Subject ideas:

- `Quick homepage idea for {{business_name}}`
- `Made a better version of {{website_url}}`

Body skeleton:

1. One specific compliment
2. One specific conversion issue
3. Mention blurred preview concept
4. Ask permission to send full version
5. Opt-out line

### Email 2: tangible upside

- Share 2-3 changes that can increase conversions
- Mention speed, mobile CTA, trust blocks
- CTA: "Want the full live demo link?"

### Email 3: breakup

- "Should I close this file?"
- Keep tone respectful, no pressure

---

## 8) Implementation Sequence (build order)

1. CRM schema + stage machine
2. Lead sourcing + enrichment + scoring
3. Preview generator and artifact storage
4. Outreach sequence with routing
5. Proposal + invoice automation
6. Delivery project generation
7. Client success automation and comms channels
8. Dashboard + QA + failure alerts
