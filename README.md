# Amne

A React and TypeScript jewelry storefront. The 37 listings contain 78 original product photos optimized as WebP. Each listing is PKR 999. The included By Amné logo file is preserved as a brand reference, and the storefront uses the Amne wordmark.

## Run locally

Install Node.js 22.12 or newer. Open a terminal in this folder and run:

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal. To run a production build:

```sh
npm run build
npm run preview
```

The ZIP also includes the built `dist/` folder. Serve that folder with a static HTTP server to preview it without installing npm dependencies. For example, on Windows with Python installed, run `py -m http.server 8080 --directory dist` and open http://localhost:8080. On macOS or Linux, use `python3` in place of `py`.

## Catalog and checkout

Edit `src/catalog.json` to add or update products. Give each listing a unique ID and store its image files under `public/photos`. The homepage highlights six products. Full listings appear in Shop and in their category pages.

The bag and wishlist are stored in the browser. Checkout is a simulation. It does not process payments, send orders, or store delivery details. The opening animation plays once per browser session and respects reduced-motion settings.

To test from a phone on the same Wi-Fi network, run `npm run dev -- --host 0.0.0.0` and open the Network URL printed in the terminal.

## Cinematic update

To apply this ZIP over an existing Amne installation, merge the extracted project files, then run `npm ci` to install the pinned dependencies. The intro uses a procedural Three.js ring and a CSS fallback. Chrome's preview environment verified the CSS fallback, navigation, search, and adding an item to the bag. WebGL rendering requires a browser with WebGL 2 enabled. GSAP ScrollTrigger controls two-way card reveals and the pinned desktop editorial section.
