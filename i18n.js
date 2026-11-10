// All on-screen text lives here. To add a language later (Hausa, Yoruba, Pidgin),
// copy the "ig" block, rename it, translate it, and add a button in app.js (LANGS).
// Any missing key automatically falls back to English.
// NOTE: Igbo text is a DEMO translation and must be checked by a fluent speaker.

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ig', label: 'Igbo' }
];

const I18N = {
  en: {
    navHome: 'Home', navLibrary: 'Library', navScan: 'Scan', navProfile: 'Profile',
    banner: 'Demo only. Not medical advice. In an emergency, call 112.',
    sosTitle: 'Emergency? Call 112', sosSub: 'Tap to call from your phone',
    heroTitle: 'First aid at your fingertips',
    heroSub: 'Simple guidance for emergencies. Download guides to use without internet.',
    tFirstAid: 'First Aid Guidance', dFirstAid: 'Step-by-step help for emergencies',
    tScan: 'QR Code Scanner', dScan: 'Scan a wristband QR code',
    tEmerg: 'Emergency Profile', dEmerg: 'Your medical details for responders',
    tProfile: 'User Profile', dProfile: 'Account and settings',
    tOffline: 'Offline Library', dOffline: 'Essential guides that work without internet',
    tDownloads: 'Downloaded Resources', dDownloads: 'Guides saved on this phone',
    tUpdates: 'Latest Updates', dUpdates: 'New and changed guidance',
    back: 'Back', updated: 'Updated', sample: 'Sample',
    steps: 'What to do', callIf: 'Call 112 if', dont: 'Do not',
    install: 'Install app on this phone',
    plannedStep: 'Planned for build step {n}', comingSoon: 'Coming soon',
    libTitle: 'First Aid Library', libIntro: 'Choose an emergency to see what to do.',
    notReviewed: 'Sample content. Not yet reviewed by a doctor.',
    igFallback: 'Igbo steps for this guide are not ready yet. Showing English.',
    updatesTitle: 'Latest Updates', updatesIntro: 'New and changed guidance will appear here.',
    pScan: 'Scan the QR code on an emergency wristband to open the wearer\'s emergency profile.',
    pEmerg: 'Create your emergency profile: allergies, conditions, medications and contacts. You choose what is shared.',
    pProfile: 'Sign in, manage your account and change your language.',
    pOffline: 'Choose essential first aid guides to save on your phone, so they work without internet.',
    pDownloads: 'Guides you have saved will be listed here, with the date each was last updated.',
    notFound: 'Page not found', notFoundText: 'That page does not exist.',
    goHome: 'Go to Home', language: 'Language'
  },

  ig: {
    navHome: 'Ụlọ', navLibrary: 'Ọbá akwụkwọ', navScan: 'Nyochaa', navProfile: 'Profaịlụ',
    banner: 'Ngosi naanị. Ọ bụghị ndụmọdụ ahụike. N\'oge mberede, kpọọ 112.',
    sosTitle: 'Mberede? Kpọọ 112', sosSub: 'Pịa ka ị kpọọ site n\'ekwentị gị',
    heroTitle: 'Enyemaka mbụ n\'aka gị',
    heroSub: 'Ntụziaka dị mfe maka mberede. Budata ha iji jiri ha n\'enweghị ịntanetị.',
    tFirstAid: 'Nduzi Enyemaka Mbụ', dFirstAid: 'Enyemaka nzọụkwụ nke nzọụkwụ maka mberede',
    tScan: 'Nyocha QR Koodu', dScan: 'Nyochaa QR koodu dị na mgbaaka aka',
    tEmerg: 'Profaịlụ Mberede', dEmerg: 'Ozi ahụike gị maka ndị na-enyere aka',
    tProfile: 'Profaịlụ Gị', dProfile: 'Akaụntụ na ntọala',
    tOffline: 'Ọbá akwụkwọ Na-enweghị Ịntanetị', dOffline: 'Ntụziaka dị mkpa na-enweghị ịntanetị',
    tDownloads: 'Ihe E Budatara', dDownloads: 'Ntụziaka e chekwara n\'ekwentị a',
    tUpdates: 'Ozi Ọhụrụ', dUpdates: 'Ozi ọhụrụ na mgbanwe',
    back: 'Laghachi', updated: 'Emelitere', sample: 'Ngosi',
    steps: 'Ihe ị ga-eme', callIf: 'Kpọọ 112 ma ọ bụrụ na', dont: 'Emela ihe ndị a',
    install: 'Tinye ngwa a n\'ekwentị',
    plannedStep: 'A ga-ewu ya n\'ọkwa {n}', comingSoon: 'Na-abịa n\'oge na-adịghị anya',
    libTitle: 'Ọbá akwụkwọ Enyemaka Mbụ', libIntro: 'Họrọ mberede ka ịhụ ihe ị ga-eme.',
    notReviewed: 'Ọdịnaya ngosi. Dọkịta enyochabeghị ya.',
    igFallback: 'Ntụziaka Igbo maka nke a adịbeghị. A na-egosi Bekee.',
    updatesTitle: 'Ozi Ọhụrụ',
    goHome: 'Gaa n\'Ụlọ', language: 'Asụsụ'
  }
};
