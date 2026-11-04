# Native app assets

Use this folder as the source for Android/iOS branding assets.

- `icon.svg`: base icon used to generate app icon assets.
- `splash.svg`: base splash artwork for the native launch screen.

After adjusting the vectors, run:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --platforms android,ios --icon resources/icon.svg --splash resources/splash.svg
```

The generated native assets will be written into the Android and iOS platform folders.
