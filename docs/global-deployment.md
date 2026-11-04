# Global deployment and PWA production guide

This project is prepared for worldwide browser delivery as a progressive web app, but a real public deployment still requires your hosting account, domain registration, and DNS configuration.

## Production URL

Suggested canonical production domain:

- https://www.missionfootball.com
- https://missionfootball.com
- https://www.missionfootball.com/admin

## Recommended hosting stack

1. Deploy the static web app to a global CDN platform such as:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - Azure Static Web Apps
2. Point the production domain to the host using DNS.
3. Enable HTTPS automatically through the hosting provider or certificate manager.
4. Keep Firebase and the football API in environment variables, never in the frontend bundle.

## DNS checklist

Create or update the following records on your domain provider:

- A record or CNAME to point the root and www hosts to the web host
- AAAA record if the host supports IPv6
- TXT record for domain verification with Google Search Console and Bing Webmaster Tools

Example DNS:

- `@` -> `CNAME` -> `your-host.provider.net`
- `www` -> `CNAME` -> `your-host.provider.net`

## HTTPS / SSL

Enable automatic HTTPS from the deployment platform. If using a custom domain:

- assign the domain to the production environment
- verify SSL certificate issuance
- redirect HTTP to HTTPS

## PWA checklist

The app is configured with:

- web manifest at `/manifest.webmanifest`
- service worker at `/sw.js`
- install button with `beforeinstallprompt`
- offline fallback page at `/offline.html`
- app theme color and metadata in the root document

The production deployment must serve these files from the public root and keep them available at HTTPS.

## Browser installation instructions

### Chrome / Edge

1. Open the site in Chrome or Edge.
2. Tap the install icon in the address bar or from the app menu.
3. Confirm installation.
4. The app opens as a standalone window.

### Safari (iPhone / iPad)

1. Open the site in Safari.
2. Tap the Share button.
3. Select Add to Home Screen.
4. Confirm the shortcut.

### Firefox

1. Open the site in Firefox.
2. Use the browser menu to install the app if the browser supports it.
3. Follow the prompt to create a launch shortcut.

### Opera

1. Open the site in Opera.
2. Use the install prompt from the browser UI.
3. Confirm install to add the app to the system.

## SEO and content publishing

- The app should publish public pages for clubs, leagues, competitions, and articles.
- Each page should use a unique title, description, Open Graph tags, and canonical URL.
- Use Google Search Console and Bing Webmaster Tools to verify ownership.

## Sitemap and robots

The public folder contains:

- `/robots.txt`
- `/sitemap.xml`

The sitemap should be updated whenever clubs, leagues, competitions, or article pages are published.

## Monitoring and reliability

Recommended setup:

- error monitoring: Sentry
- uptime checks: UptimeRobot or Better Stack
- analytics: Google Analytics or GA4
- backups: Firestore and deployment snapshots
- CDN logs: Cloudflare or platform-native logs

## Production deployment commands

```bash
npm install
npm run build
npm run preview -- --host 0.0.0.0
```

Then deploy the output to your chosen hosting provider and configure the production domain.

## App store packaging

The app already has Capacitor support for Android and iOS:

```bash
npm run cap:sync
npm run cap:android
npm run cap:ios
```

For App Store / Play release:

- generate proper icon and splash assets
- sign Android release builds
- sign Apple certificates and provisioning profiles
- test on device before upload

## Security checklist

- Do not expose Firebase service credentials in the browser
- Keep admin email / admin role checks server-side where applicable
- Use HTTPS everywhere
- Redeploy after any environment variable change
- Review Firestore security rules before production release

## Final production requirement

A real public deployment cannot be completed in this editor without:

1. a hosting account,
2. a registered domain,
3. the real production Firebase project values,
4. the live football API credentials,
5. and the actual DNS configuration.

This repo is now ready for that step, but the final live public launch depends on those external credentials and domain ownership.
