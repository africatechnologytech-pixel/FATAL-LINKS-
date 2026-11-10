# FATAL LINKS (concept prototype)

First aid at your fingertips. **Demo only. Not medical advice. In an emergency, call 112.**

This is a competition prototype. All guides, updates and translations are sample content and have not been reviewed by a doctor. Igbo text is a demo translation pending review by a fluent speaker.

## Publish on GitHub Pages
1. Upload all files to the root of your repository.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick the `main` branch and the `/ (root)` folder, then Save.
4. After a minute your app is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.
5. Open that link on your phone and use the browser menu: **Add to Home screen** / **Install app**.

## Files
- `index.html` the page shell
- `styles.css` the look
- `app.js` screens and navigation
- `i18n.js` all text in English and Igbo (add more languages here)
- `data.js` sample guides and updates (this is what Firebase will replace later)
- `sw.js` makes the app open offline
- `manifest.json` and `icon-*.png` make it installable

## Build steps
1. Foundation, dashboard, navigation, languages (this step)
2. Library, search, second language content
3. Read-aloud
4. Offline downloads
5. Sign-in and emergency profile (Firebase)
6. QR code generation, public emergency page, scanner
7. Latest updates, polish, demo content
