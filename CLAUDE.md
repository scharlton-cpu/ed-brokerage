# E&D Brokerage website

Static site (index.html + img/), deployed by Vercel from the `main` branch.

- After every change the owner asks for, commit it and push to `main` right away, without asking. Vercel redeploys on each push.
- Business details, rental info, inventory, photos and the form endpoint all live in the `SITE` object near the bottom of index.html. Edit there rather than in the markup.
- Never put unverified claims (ratings, stats, years, licenses) on the site. Leave a field `null` until the owner supplies it.
- New photos: convert to WebP at 1672px and 960px widths into img/, then reference them with photo('name', {...}) in SITE.images.
- Staff area lives under `/staff` (staff/index.html hub, staff/agreement.html car rental agreement). `middleware.js` password-protects it with HTTP Basic Auth using the Vercel env vars STAFF_USER (default "staff") and STAFF_PASSWORD. Never put the password in the repo. Staff pages are not linked from the public site and are noindex. The agreement never sends data to a server; the PDF is made on the device.
