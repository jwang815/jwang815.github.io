# Hosting and DNS Playbook

Use this SOP for every paid client launch.

## 1) Standard Hosting Architecture

Default stack:

- Frontend: Vercel or Netlify
- DNS + CDN + SSL: Cloudflare
- Forms/email: provider-specific (Resend/Postmark/SMTP relay)
- CMS/blog (if needed): headless CMS or managed WordPress

Principles:

- Always launch to staging first.
- Never cut DNS without validated rollback.
- Keep TTL low before cutover.

---

## 2) Access Collection Checklist (intake)

Collect from client:

- Domain registrar and login owner
- Current DNS host
- Current web host
- Email provider (Google Workspace, M365, etc.)
- Business-critical third-party records (MX, TXT, SPF, DKIM, payment, booking apps)
- Preferred subdomain strategy (`www` vs apex)

Store encrypted access notes and audit who changed what.

---

## 3) DNS Record Baseline

At minimum maintain:

- `A` / `AAAA` or `CNAME` records for site
- `www` record behavior
- `MX` records unchanged unless email migration is intentional
- `TXT` SPF
- `TXT` DKIM
- `TXT` DMARC
- Verification TXT/CNAME (Google, Facebook, etc.)

Never delete unknown records without validation.

---

## 4) Cutover Procedure

1. **48-24h before**
   - Export existing DNS zone
   - Set TTL to low value (for affected records)
   - Confirm SSL provisioning method
2. **Pre-launch QA**
   - Staging approved by client
   - Forms submit successfully
   - Analytics + conversion events working
   - Mobile + desktop smoke tested
3. **Cutover**
   - Update target records
   - Purge CDN cache
   - Validate from multiple regions (or via external checker)
4. **Post-cutover monitoring**
   - Check uptime and errors every 15-30 mins for first hours
   - Confirm transactional emails and contact forms still work

---

## 5) Rollback Plan (must be prepared before cutover)

Rollback trigger examples:

- Site downtime > acceptable threshold
- Forms or payment flow broken
- Email delivery disruption from accidental MX/TXT changes

Rollback actions:

1. Restore exported DNS zone or revert changed records.
2. Re-enable prior origin if needed.
3. Re-test key user journeys.
4. Send client incident summary and revised launch window.

---

## 6) Multi-Client Management Pattern

For agency scale:

- One Cloudflare account with strict role permissions
- One project folder per client with:
  - DNS snapshot
  - Launch checklist
  - Rollback checklist
  - Credentials inventory (secured vault)
- Standard naming conventions for environments:
  - `client-prod`
  - `client-staging`

---

## 7) Security and Compliance Notes

- Use least-privilege access for DNS/hosting.
- Require 2FA on registrar, DNS, and hosting accounts.
- Keep change logs for every production update.
- Never store plaintext client credentials in chat logs.
