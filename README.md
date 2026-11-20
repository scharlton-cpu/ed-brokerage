# E&D Brokerage website

Static site: `index.html` + `img/`. No build step.

## Edit business details
Open `index.html`, search for `const SITE = {`. Fill in phone, email, address, hours, rates, license no., inventory, etc.
Set `mode: 'prod'` before launch to hide anything still missing and remove the draft bar.
Set `formEndpoint` (e.g. a Formspree URL) so the quote form actually sends.

## Deploy
Push to GitHub, then in Vercel: Add New → Project → import the repo → Framework preset "Other" → Deploy.
Every push to `main` redeploys automatically.
