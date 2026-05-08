# DNS Plan — docvault.uk

> M0.4 deliverable. Documents the DNS configuration for the DocVault production domain.

## Domain

**docvault.uk** — registered via a UK registrar. All subdomains below are under this apex.

## Record Plan

| Type  | Name                  | Value / Target                                      | TTL  | Purpose                                  |
|-------|-----------------------|-----------------------------------------------------|------|------------------------------------------|
| A     | docvault.uk           | Cloudflare Pages (proxied)                          | Auto | Marketing site (Next.js static export)   |
| CNAME | www                   | docvault.uk                                         | Auto | Redirect www → apex                      |
| CNAME | app                   | `<cloudflare-pages-project>.pages.dev`              | Auto | Web app shell (future M0.5+)            |
| CNAME | api                   | `<fly.io-or-railway-host>`                          | 300  | Express/tRPC API server                  |
| MX    | docvault.uk           | `feedback-smtp.eu-west-1.amazonses.com` (pri 10)    | 3600 | Resend inbound (if needed)               |
| TXT   | docvault.uk           | `v=spf1 include:amazonses.com ~all`                 | 3600 | SPF for Resend sending                   |
| CNAME | resend._domainkey     | Provided by Resend dashboard                        | Auto | DKIM for Resend                          |
| TXT   | _dmarc                | `v=DMARC1; p=quarantine; rua=mailto:dmarc@docvault.uk` | 3600 | DMARC policy                         |

## Subdomains Summary

| Subdomain         | Service               | Provider         |
|-------------------|-----------------------|------------------|
| (apex)            | Marketing site        | Cloudflare Pages |
| www               | Redirect to apex      | Cloudflare       |
| app               | Web application       | Cloudflare Pages |
| api               | Backend API           | Fly.io / Railway |

## Email (Resend) Setup

1. **Add domain in Resend dashboard** → docvault.uk
2. **Add DNS records** provided by Resend (SPF TXT, DKIM CNAME, optional MX)
3. **Verify domain** in Resend
4. **Set `AUTH_FROM_EMAIL`** to `noreply@docvault.uk` in production env

### Resend Records (to be confirmed from dashboard)

- SPF: Already covered by `include:amazonses.com` in the TXT record above
- DKIM: CNAME `resend._domainkey.docvault.uk` → value from Resend
- Return-Path: May require additional CNAME for bounce handling

## Cloudflare Pages Setup

1. **Create project** in Cloudflare Pages dashboard
2. **Connect GitHub repo** (HassanImtiaz09/MindVault)
3. **Build settings:**
   - Build command: `cd apps/marketing && pnpm install && pnpm build`
   - Output directory: `apps/marketing/out`
   - Root directory: `/`
4. **Custom domain:** Add `docvault.uk` and `www.docvault.uk`
5. **Redirects:** Add `_redirects` file: `https://www.docvault.uk/* https://docvault.uk/:splat 301`

## SSL/TLS

- Cloudflare provides automatic SSL for proxied records (Full Strict mode)
- API subdomain: ensure origin also has valid cert (Let's Encrypt or provider-managed)

## Notes

- We do **not** own `docvault.app` — all references must use `docvault.uk`
- Cloudflare is the DNS provider (nameservers pointed to Cloudflare)
- All records should be proxied (orange cloud) where possible for DDoS protection
- API record may need to be DNS-only (grey cloud) if the hosting provider requires it
