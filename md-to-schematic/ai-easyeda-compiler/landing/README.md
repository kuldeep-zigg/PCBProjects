# Landing page — Spec → Schematic

## Preview locally

Open `index.html` in your browser (double-click or `open index.html`).

## Go live

- **Netlify:** Drag this folder onto [app.netlify.com/drop](https://app.netlify.com/drop).
- **GitHub Pages:** Push this repo, Settings → Pages → source: main, folder: `/landing` (or root if only this site).

## 1. Form (Formspree)

1. Sign up at [formspree.io](https://formspree.io) and create a new form.
2. Copy your form ID (e.g. `mknqweop` from `https://formspree.io/f/mknqweop`).
3. In `index.html`, replace `YOUR_FORM_ID` with it:
   ```html
   action="https://formspree.io/f/mknqweop"
   ```
4. Submissions will email you; you can set a redirect URL in the Formspree dashboard.

## 2. Payment (Stripe or Gumroad)

1. **Stripe:** Dashboard → Product → Create → “Pro $19/month” → Create payment link. Copy the link.
2. **Gumroad:** Create product “Spec to Schematic Pro” $19/month, copy product URL.
3. In `index.html`, replace `YOUR_PAYMENT_LINK` with that URL:
   ```html
   <a href="https://buy.stripe.com/..." class="btn btn-primary" id="pro-button">
   ```
   or
   ```html
   <a href="https://gumroad.com/l/your-product" class="btn btn-primary" id="pro-button">
   ```

After replacing both, the landing page is ready to collect signups and payments.
