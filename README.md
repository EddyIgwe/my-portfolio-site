# Edwin Igwebuike: portfolio

The portfolio of Edwin Igwebuike, Brand & Marketing Designer. One ink on one paper with a solid royal blue accent, in a light or a dark theme that covers the whole page, hero and navigation included, laid out on a grid of hairlines. Type is set in Aeonik Pro (see Fonts below). In the hero, Edwin's initials, EI, in calligraphic script inside a circle, are built live in 3D out of halftone dots with WebGL. Dots exist only on the letters and the ring.

Built with React 18, TypeScript and Vite 5. The site is prerendered to static HTML at build time, so it is readable, indexable and fast before any JavaScript runs. There is no UI library and no animation library. Motion is plain CSS plus a few small hooks.

## Deploy

The `dist/` folder in this package is already built and ready to deploy.

**Option A: Netlify with Git (recommended).** Push this folder to a GitHub repository and import it in Netlify. `netlify.toml` already sets the build command (`npm run build`) and the publish folder (`dist`).

**Option B: drag and drop.** Drag the `dist/` folder onto the site's Deploys page in Netlify (or app.netlify.com/drop).

### Turn on the contact form (one time, in Netlify)

1. Open **Site configuration → Forms** and click **Enable form detection**.
2. Redeploy, so Netlify can find the form. It is named `contact`.
3. Open **Forms → Form notifications → Add notification → Email notification** and enter `edwinigwebuike7@gmail.com`.
4. Send a test message from the live site and check that it arrives.

Spam protection uses a honeypot field (`bot-field`) plus Netlify's built-in spam filtering. Flagged messages appear under **Forms → Spam**.

## Work on it locally

```bash
npm install
npm run dev            # local dev server
npm run build          # typecheck, build, prerender → dist/
npm run preview        # serve dist/ locally
```

## Where things live

| Path | What it holds |
| --- | --- |
| `src/content.ts` | **Every word on the site**, all links, the 22 projects and their Behance stats |
| `src/styles.css` | Colour (light, dark and the royal blue accent: `--accent`, `--accent-text`), type, spacing, layout and motion |
| `src/hero/halftone.ts` | The WebGL halftone monogram: assembly, rounded relief, depth layers, slow turn, fingertip press, adaptive quality |
| `src/hero/monogram-map.webp` | The monogram the dots are built from: where the mark is in green, its rounded height in blue |
| `src/lib/theme.ts`, `src/components/ThemeToggle.tsx` | Light and dark theme: follows the system until the visitor chooses, then remembers the choice |
| `src/components/` | One file per section: Nav (with the mobile menu), Hero, Availability, About, Work (the carousel), Experience, Rates, Contact, Footer, NotFound |
| `index.html` | Title, meta description, Open Graph and Twitter cards, favicons, structured data, and the static twin of the contact form that Netlify detects |
| `public/work/` | Project covers, 808 px and 480 px WebP, full colour |
| `public/hero/` | Still versions of the monogram for phones and reduced motion |
| `public/portrait/` | Edwin's photo, shown in the hero |
| `public/assets/Edwin-Igwebuike-CV.pdf` | The CV, at the same address as on the current site |

## Updating content

**Projects.** Each project in `src/content.ts` has an `appreciations` and a `views` figure taken from Behance on 27 October 2026. The carousel shows the newest first, by publish date on Behance (taken from the gallery number in each link, which Behance issues in order). To add a project, add an entry and two images named `<id>-808.webp` and `<id>-480.webp` (808 × 632, the Behance cover size) to `public/work/`.

**Fonts.** The site is set up for **Aeonik Pro** (CoType Foundry). It is a commercial typeface, so it is not included. With a web licence, put the files in `public/fonts/` as `AeonikPro-Regular.woff2`, `AeonikPro-Medium.woff2` and `AeonikPro-Bold.woff2`, then uncomment the Aeonik Pro block near the top of `src/styles.css` and rebuild. Until then the site uses **Albert Sans**, a free typeface with the same geometric build. Anyone with Aeonik Pro installed on their computer already sees it, including the free trial fonts (named "Aeonik Pro TRIAL"). The trial licence only allows testing on your own computers, so the trial files must not be added to `public/fonts/` or deployed.

**Hero monogram.** The mark is drawn by `scripts/make-monogram.mjs` from the Great Vibes script font and a ring. To change the letters, size or font, edit the top of that script (or set `MONO_FONT` and `MONO_TEXT`), then rebuild the map, the stills and the social image (needs Python with Pillow and NumPy):

```bash
npm i -D playwright && npx playwright install chromium
node scripts/make-monogram.mjs
node scripts/render-stills.mjs && python3 scripts/encode-stills.py
node scripts/render-og.mjs
```

The same commands apply after changing `src/hero/halftone.ts`.

**No emoji.** The site uses no emoji. Arrows are drawn lines (`src/components/Arrow.tsx`): write `<Arrow />` for a link that opens elsewhere and `<Arrow dir="se" />` for one that moves down the page. Do not type arrow characters such as ↗ or ↘ into the copy: the typeface does not include them, so phones draw them from their emoji font.

**Motion.** Every movement follows four rules: entrances ease out, exits ease in, interface responses spring with a slight overshoot, and nothing moves on a linear curve. The three curves are tokens at the top of `src/styles.css`: `--ease-out` (things arriving: scroll reveals, the hero load, the menu opening, a hover taking hold), `--ease-in` (things leaving: the menu closing, a hover letting go, the outgoing preview image) and `--spring` (things answering the visitor: arrows, presses, the theme icon, the menu icon, underlines, the counter). Use one of the three for anything new. The carousel moves between cards on a real spring (about 3% past the card, then back), the hero monogram assembles on an ease-out and its fingertip press is a spring, and the theme change wipes in on the ease-out curve.

## Checks run before handover (27 October 2026)

**Behance.** All 22 project links returned 200 and showed the matching project title. The profile shows 15,323 project views and 1,230 appreciations, which supports "15K+ views" and "1.2K appreciations" on the site.

**Other links**

| Link | Result |
| --- | --- |
| behance.net/edwinigwebuike007 | Works |
| dribbble.com/edwinigwe | Works, shows Edwin Igwebuike |
| t.me/jefe_007 | Works, shows "El Jefe, Graphic Designer" |
| Loom introduction video | Works, "Edwin's Graphic Design and Motion Experience Overview" |
| linkedin.com/in/edwin-igwebuike-0925a51a1 | LinkedIn shows a sign-in wall to signed-out visitors, so it could not be confirmed. The address matches the link in the CV. |
| twitter.com/RayThe_Kid | **Hidden on the site.** X shows "We're unable to show this account" to signed-out visitors. |
| instagram.com/el.jefe_ | **Hidden on the site.** This handle belongs to a different person. The old site's handle (instagram.com/\_el\_.jefe\_) shows "Profile isn't available". |

To show Twitter or Instagram, set `enabled: true` on its entry in `social` in `src/content.ts` (and fill in the correct Instagram handle).

**Automated run: 89 checks, all passing** (re-run 29 October 2026). Run in Chromium against the built site and a local server that behaves like Netlify Forms.

- **Hero.** Follows the light or dark theme, fills the first screen, the live 3D monogram runs, and the name is 78 px at 1440 px wide and 51 px on a phone. Phones and reduced motion get the still monogram.
- **Theme.** Follows the system setting; the toggle switches the page, remembers the choice and applies it before the first paint on the next visit. Hero, navigation, menu and footer follow it, including the live dot monogram. The browser bar colour follows the page.
- **Split page.** Scrolling and hovering both choose the discipline. The preview keeps the chosen project after the pointer leaves the list, and clicking it opens that project on Behance in a new tab. The short-form video and motion disciplines show a plain panel with no link. A hairline divides the two halves.
- **Carousel.** 22 cards, each with a Behance link that opens in a new tab. The focused card sits in the centre, lifted on a soft shadow; the others swing back round a shallow 3D curve, fade with distance, and their covers and text drift into place as they arrive. Clicking a neighbour brings it to the centre. Arrows move one card, the counter shows the focused card, arrow keys and Home/End work, a mouse drag scrolls and settles on a card without opening one, a plain click opens the project, and the progress hairline can be clicked or dragged. Projects run newest first. Every filter shows the right number of projects (4, 5, 2, 10, 3, 1, 22), starts from the first card and is announced to screen readers.
- **Contact form.** Validation for every required field and the email format, focus moves to the first problem, the payload is shaped for Netlify (`form-name`, `bot-field`, topic, name, email, company, details), the success message shows on a 200 response, and the failure message shows on a 500 with the visitor's text kept. Rates pre-fill the form.
- **Mobile menu.** Opens over the page, locks scrolling and makes the page behind inert, closes on Escape (focus returns to the button) and on choosing a link, which then scrolls to its section.
- **Layout.** No horizontal scrolling at 360, 390, 430, 768, 1024, 1280, 1440, 1920 and 2560 px wide.
- **Copy.** No em dashes in visible text, alt text or meta tags. No emoji anywhere (text, attributes, meta tags, CSS content) on the home page at desktop and phone width or on the 404 page.
- **Motion.** No linear or stock curves anywhere on the page, only the three motion curves. Buttons and links ease out on hover and ease in when the pointer leaves, and presses spring. The carousel springs a little past the next card (2.6%) and settles exactly on it, quick presses add up, and the counter ticks over on the spring. Filtered cards and the theme wipe ease out. The menu opens easing out and closes faster, easing in. With reduced motion the carousel moves at once.

Delivery to the inbox needs the Netlify steps above.

## Decisions to confirm

- **Project order.** Newest first, by Behance publish date. Persici Agency shows 2025 (the year on its cover) but was published in January 2026, so it sits among the 2026 projects.
- **Go Brewing job title.** The site says "Brand & Marketing Designer", as the brief asks. The CV PDF still says "Graphic Designer".
- **Persici Agency year.** It shows 2025, as printed on the cover. Behance lists it as published in January 2026.
