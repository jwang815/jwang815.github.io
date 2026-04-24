# Autonomous Website Agency OS

This folder contains a practical operating system to run an AI-assisted website design agency end to end:

1. Find weak business websites in the US
2. Qualify leads automatically
3. Run compliant cold outreach
4. Send a blurred redesign preview
5. Convert, invoice, and collect payment
6. Handoff to web design production
7. Manage delivery and client success
8. Handle hosting and DNS migration

## Start Here

1. Read `PIPELINE_SPEC.md` for the full architecture and stage gates.
2. Read `HOSTING_DNS_PLAYBOOK.md` for deployment and domain cutover SOPs.
3. Copy `MASTER_OPERATOR_PROMPT.md` into your AI agent as a system prompt.
4. Implement workflows in your automation stack (recommended: n8n + Airtable/Supabase + Postmark + Stripe + Cloudflare + Slack).

## What You Get

- Multi-agent responsibilities and handoffs
- Lead scoring model and qualification criteria
- Cold email sequence and reply routing logic
- Blurred preview + full demo offer workflow
- Payment and production triggers
- Client success communication protocol
- Risk/compliance checklist (CAN-SPAM, consent, claims, unsubscribe, data hygiene)

## Important Guardrails

- Do not send deceptive claims. Only say "I already designed your site" if you actually generated a preview.
- Include opt-out and sender identity in every cold email.
- Respect suppression lists, bounces, and unsubscribes immediately.
- Store CRM and conversation history in one source of truth.
