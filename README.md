# FATAL LINKS (concept prototype)

First aid at your fingertips. **Demo only. Not medical advice. In an emergency, call 112.**

All guides, updates, the profile and translations are SAMPLE content, not reviewed by a doctor. Igbo text is a demo translation pending review by a fluent speaker.

## Publish on GitHub Pages
1. Upload ALL files to the top level of your repo (no folders).
2. Settings > Pages > Deploy from a branch > `main` + `/ (root)`.
3. Open your github.io link. To test the files, open `check.html` on the same site.
4. If you change files and the phone shows old content, change `fatal-links-v2` to `v3` in `sw.js`.

## Files (14)
index.html, styles.css, app.js, i18n.js, data.js, sw.js, manifest.json, check.html, logo.png, icon-192.png, icon-512.png, icon-maskable-512.png, README.md

## Build steps
1. Foundation, dashboard, navigation, languages (done)
1b. Install fixes, logo, new look, search, read-aloud (English), offline list (this version)
2. Full library content and Igbo guide text
3. Igbo audio
4. Real offline storage of content
5. Sign-in and real emergency profiles (Firebase)
6. QR generation, public emergency page, scanner
7. Latest updates from Firebase, polish
