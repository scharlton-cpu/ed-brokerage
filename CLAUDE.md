# E&D Brokerage website

Static site (index.html + img/), deployed by Vercel from the `main` branch.

- After every change the owner asks for, commit it and push to `main` right away, without asking. Vercel redeploys on each push.
- Business details, rental info, inventory, photos and the form endpoint all live in the `SITE` object near the bottom of index.html. Edit there rather than in the markup.
- Never put unverified claims (ratings, stats, years, licenses) on the site. Leave a field `null` until the owner supplies it.
- New photos: convert to WebP at 1672px and 960px widths into img/, then reference them with photo('name', {...}) in SITE.images.
- Staff area lives under `/staff` (staff/index.html hub, staff/agreement.html car rental agreement). `middleware.js` shows a branded sign-in page and sets a 30-day cookie. It stores only PBKDF2/SHA-256 hashes (SALT, LOGIN_HASH, COOKIE_CHECK), never the password. To reset the password, generate a new random passphrase, recompute those three values, push, and give the owner the new password in chat only. No Vercel env vars are used. Staff pages are noindex and not linked from the public site.
