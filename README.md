# CJ Huang — personal website

Plain HTML/CSS/JS. There's no build step, and any static host can serve it.

```
index.html  about.html  projects.html  teaching.html  writing.html  contact.html  404.html
assets/style.css   colours, fonts, layout (change --accent at the top)
assets/cosmos.js   the animated space scenes. Each page's <canvas data-cosmos> picks one with data-scene:
                   web (Home: observable universe) · flow (Work: Laniakea → Virgo) · localgroup (About: Local Group → Milky Way)
                   arm (Teaching: Orion Arm → Gould Belt) · bubble (Writing: Local Bubble → LIC) · solar (Contact: Oort Cloud → Earth)
                   Tune with data-x / data-y / data-size / data-tilt / data-stars / data-speed
assets/ambient.js  optional background sound, generated live in the browser (no audio files, nothing to license).
                   Off by default; visitors turn it on with SOUND in the menu bar and the choice is remembered.
                   Each page's sound follows <body data-scene="...">. Change the volume at linearRampToValueAtTime(0.45 ...)
assets/main.js     filter buttons on Work and Writing
assets/favicon.svg browser-tab icon
```

## Before you go live, fill in
- `about.html` — your photo (`assets/photo.jpg`, see the comment in the photo box), the timeline years, your B.S.
- `assets/CJ-Huang-Resume-EN.pdf` and `assets/CJ-Huang-Resume-ZH.pdf` — add your résumé PDFs with these names
- `contact.html` — email, GitHub, LinkedIn, Medium links
- Projects / Home — the `[ADD …]` hardware projects
- Contact + newsletter forms: create a free form at https://formspree.io, then replace `YOUR_FORM_ID` in `contact.html` and `teaching.html`

## Put it on cjhuanglab.com (GitHub Pages, free hosting)
The `CNAME` file in this folder already contains `cjhuanglab.com`. Keep it in the repo root.

1. **Buy cjhuanglab.com** (for example at Cloudflare Registrar or Porkbun).
2. **Create a GitHub repo** named `<your-username>.github.io` (public) and upload everything in this folder to the repo root.
3. **Turn on Pages**: in the repo, go to Settings → Pages → Build and deployment → Source: *Deploy from a branch* → `main` / `(root)` → Save.
4. **Add the domain in GitHub first**: Settings → Pages → Custom domain → `cjhuanglab.com` → Save.
5. **Add these DNS records at your registrar** (delete any default "parking" A/CNAME records on `@` and `www` first):

   | Type  | Name / Host | Value / Target |
   |-------|-------------|----------------|
   | A     | @   | 185.199.108.153 |
   | A     | @   | 185.199.109.153 |
   | A     | @   | 185.199.110.153 |
   | A     | @   | 185.199.111.153 |
   | AAAA  | @   | 2606:50c0:8000::153 |
   | AAAA  | @   | 2606:50c0:8001::153 |
   | AAAA  | @   | 2606:50c0:8002::153 |
   | AAAA  | @   | 2606:50c0:8003::153 |
   | CNAME | www | `<your-username>.github.io` |

   On Cloudflare, set every record to **DNS only** (grey cloud) so GitHub can issue the HTTPS certificate.
6. **Wait, then lock in HTTPS**: DNS can take up to 24 h. When Settings → Pages shows "DNS check successful", tick **Enforce HTTPS**.
7. **Protect the domain**: GitHub → your profile → Settings → Pages → *Add a domain* → `cjhuanglab.com`, then add the TXT record GitHub shows you at your registrar and click Verify.
8. **Check**: https://cjhuanglab.com and https://www.cjhuanglab.com should both open your site.
9. Optional: submit `https://cjhuanglab.com/sitemap.xml` in Google Search Console so your name shows up in search.
