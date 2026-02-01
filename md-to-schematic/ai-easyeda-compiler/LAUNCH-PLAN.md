# Launch plan: Spec → Schematic (PCB from spec)

Use this to go from “landing page” to “first paying user” in 1–2 weeks.

---

## What you have

- **Landing page:** `landing/index.html` + `landing/styles.css` (free tier + Pro $19/mo).
- **Product:** Your repo (markdown → schematic + BOM via CLI + Ollama + Nexar).
- **Hosting:** One Apple laptop; can host landing on GitHub Pages, Netlify, or Vercel for free.

---

## Week 1: Ship the free tier

### 1. Host the landing page

- **Option A — GitHub Pages**
  - Push `landing/` to a repo (e.g. `yourusername/spec-to-schematic`).
  - Settings → Pages → Source: main branch, folder `/landing` (or root if you put only the site there).
  - Site: `https://yourusername.github.io/spec-to-schematic/`.

- **Option B — Netlify**
  - Drag the folder containing `landing/` (with `index.html`) to [netlify.com/drop](https://app.netlify.com/drop).
  - You get a URL like `https://random-name.netlify.app`. You can rename it in Site settings.

- **Option C — Vercel**
  - Install Vercel CLI: `npm i -g vercel`.
  - From the repo root: `vercel` and follow prompts; set “root directory” to `landing` if needed.

### 2. Connect the “Get started free” form

Right now the form only shows an alert. Pick one path:

- **No backend (fastest):**
  - Use a form service that emails you or adds to a sheet:
    - [Formspree](https://formspree.io) — form action = their endpoint; they email you.
    - [Google Forms](https://forms.google.com) — embed or link “Get started” to the form; responses in a sheet.
  - In the form, ask: “Email” and “What’s your first board idea? (one line).”
  - You reply manually with a link to your CLI/instructions or a simple “run in browser” flow if you add one later.

- **With a small backend (later):**
  - One serverless function (Vercel/Netlify) that:
    - Accepts email + optional “first spec” text.
    - Sends email (Resend, SendGrid) or saves to Airtable/Notion.
    - Optionally: enqueue a job to run your pipeline and email the result (then you’re already “free tier”).

### 3. Clarify “free tier” for users

- Decide: “3 projects per month” = 3 runs of “spec → schematic” per email (or per account when you add auth).
- Add one line on the landing: “Free: 3 projects/month. We’ll email your schematic + BOM.”
- If you’re manual at first: “We’ll reply within 24 hours with your first schematic.”

---

## Week 2: Add payment (Pro tier)

### Option A — Stripe

- Create account: [stripe.com](https://stripe.com).
- Add a product: “Pro — $19/month” (subscription).
- **Checkout link (no code):** Stripe Dashboard → Products → Pro → “Create payment link”. Use that as “Start Pro trial” button `href`.
- **With code (later):** Use [Stripe Checkout](https://stripe.com/docs/checkout) or [Customer portal](https://stripe.com/docs/customer-management/portal) so users can subscribe and cancel.

### Option B — Gumroad

- Create product: “Spec to Schematic Pro — $19/month” (or one-time if you prefer).
- Gumroad gives you a link. Put it on the “Start Pro trial” button.
- Good for “sell once” or simple subscription; less flexible than Stripe for usage-based later.

### Option C — Lemon Squeezy

- [lemonsqueezy.com](https://lemonsqueezy.com) — similar to Gumroad, handles tax/VAT.
- Create subscription product, get link, same as Gumroad for the button.

**Recommendation:** Start with **Stripe Payment Link** or **Gumroad** so you don’t write backend code. Replace the “Start Pro trial” button `href` with your payment link.

---

## Put it in front of 10–20 people

- **Reddit:** r/PrintedCircuitBoard, r/electronics, r/AskElectronics. Post: “I built a tool that turns a text spec into a schematic + BOM (EasyEDA). Free tier, no card. Would love feedback.” Link to landing + 1–2 example inputs/outputs.
- **Indie Hackers:** [indiehackers.com](https://www.indiehackers.com) — “Ship” or “Share” post with same message.
- **Twitter/X:** Short thread: “Problem / What I built / Free tier link / Would love feedback.”
- **Hackaday / EEVblog:** If you have a short demo (e.g. Loom), one post or comment with link.

**Ask explicitly:** “If this saved you 2 hours on your last board, would you pay $19/mo for unlimited?” (or one-time). Use answers to decide free vs paid limits.

---

## Checklist

- [ ] Landing page live (GitHub Pages / Netlify / Vercel).
- [ ] “Get started free” collects email (and optionally first spec) via Formspree or Google Form.
- [ ] You reply to each signup (or automate with a simple script + email).
- [ ] “Start Pro trial” button points to Stripe Payment Link or Gumroad/Lemon Squeezy.
- [ ] One post on Reddit, one on Indie Hackers, one on Twitter with link to landing.
- [ ] Ask 10–20 people “Would you pay $19/mo?” and note replies.

After that, iterate: add a simple “run one free project in the browser” (e.g. form → your backend runs CLI → email result) so free users get value without installing anything. Then tighten limits and push Pro.
