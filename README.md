# 🎓 Online Education Guru (OEG)

બાલવાટિકાથી ધોરણ 8 સુધીના વિદ્યાર્થીઓ, શિક્ષકો અને આચાર્યો માટેનું **પ્રીમિયમ શૈક્ષણિક પ્લેટફોર્મ** —
**GitHub Pages** પર હોસ્ટ થાય છે અને **Blogger (blogspot.com)** માં live embed થાય છે.

> **ભાષાઓ:** ગુજરાતી • हिन्दी • English (એક ક્લિકમાં બદલાય) | **ડાર્ક મોડ** | **PWA-ready**

---

## ✨ ફિચર્સ

| વિભાગ | શું મળશે |
|---|---|
| 📚 **પાઠ્યપુસ્તક** | બાલવાટિકા + ધોરણ 1–8, દરેક ધોરણ અલગ, વિષય ફિલ્ટર |
| 📝 **સ્વાધ્યાયપોથી** | ધોરણ 1–5 અને 6–8 અલગ સંગ્રહ |
| 🎮 **શૈક્ષણિક રમત (Game Zone)** | 3 બિલ્ટ-ઈન ગેમ્સ (ક્વિઝ, મેમરી મેચ, ગણિત ચેલેન્જ) + અપલોડેડ HTML ગેમ્સ |
| 🗂️ **Office Documents** | PDF / DOC / PPT / HTML / Image — વ્યૂઅર + ડાઉનલોડ |
| 👩‍🏫 **Teachers Helper** | પાઠ આયોજન, પ્રશ્નપત્ર નમૂના વગેરે |
| 🧑‍🎓 **Students** | ગૃહકાર્ય પ્લાનર વગેરે |
| ▶️ **વિડિયો** | YouTube લિંક → એ જ પેજ પર પ્લેયર (youtube-nocookie embed) |
| 📰 **બ્લોગ / પોસ્ટ** | ઈમેજ + ડાઉનલોડ બટન સાથે પોસ્ટ |
| 🔗 **ઉપયોગી લિંક્સ** | GCERT, DIKSHA, GSEB, GSBSTB + લોકપ્રિય શિક્ષક બ્લોગ્સ |
| 🔐 **Register / Login** | શિક્ષક / વિદ્યાર્થી / આચાર્ય (Firebase Auth) |
| 🛠️ **Admin Panel** | GitHub માં ફાઈલ અપલોડ, પોસ્ટ એડિટર, વિડિયો, AdSense સેટિંગ, ફાઈલ મેનેજર |
| 📤 **શેર** | WhatsApp / Facebook / X / Telegram + લિંક કોપી |
| 💰 **AdSense** | પોલિસી-સેફ પ્લેસમેન્ટ (લેબલ સાથે, બટનથી દૂર) |

---

## 🚀 ડિપ્લોય: GitHub Pages

1. આ રિપો GitHub પર push કરો (branch: `main`).
2. **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `(root)`.
3. સાઈટ live: `https://onlineeducationguru.github.io/OEG/`
4. `js/config.js` અને `data/site-config.json` માં `siteUrl` તમારા Pages URL મુજબ રાખો.

> ⚠️ **નોંધ:** `node_modules/` GitHub પર push **ન કરો** — `.gitignore` માં છે. ફોન્ટ્સ પહેલેથી `assets/fonts/` માં કોપી થયેલા છે.

---

## 🅱️ Blogger માં લગાવવું (XML Theme)

1. Blogger Dashboard → **Theme** → **Customize ▼** → **Backup** (હાલની થીમ સાચવો — જરૂરી!).
2. **Theme → Customize ▼ → Restore → Upload** → `blogger/OEG-Blogger-Theme.xml` પસંદ કરો.
3. થઈ ગયું! Blogger પેજ પર GitHub Pages સાઈટ **iframe માં live** દેખાશે —
   GitHub પરની **HTML, PDF, Image, DOC** ફાઈલો Blogger પેજમાં જ દેખાશે.
4. Blogger ની પોતાની પોસ્ટ્સ પણ નીચે દેખાશે (SEO માટે).

---

## 🛠️ Admin Panel વાપરવું

> 🔒 **એક્સેસ નિયંત્રણ:** Admin Panel હવે **ફક્ત માલિક (owner) માટે** છે.
> ડિફોલ્ટેટ કોઈને એક્સેસ નથી. ચાલુ કરવા: **data/site-config.json** → `"admin": { "emails": ["તમારું-ઈમેઈલ@gmail.com"] }`
> ભરો (GitHub પર ફાઈલ → ✏️ Edit → Commit). પછી સાઈટ પર તે જ ઈમેઈલથી Login કરો —
> Admin Panel લિંક menu માં આપોઆપ દેખાશે. ટેસ્ટ માટે અસ્થાયીરૂપે `"emails": ["*"]` રાખી શકો (બધાને ખુલ્લું).
> Admin Panel ના **🔐 એક્સેસ કંટ્રોલ** પેનલમાંથી પણ આ ઈમેઈલ લિસ્ટ બદલી શકાય છે.

1. સાઈટ ખોલો → **Admin Panel** (`#/admin`).
2. GitHub **Fine-grained PAT** બનાવો: GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Repository access: ફક્ત આ રિપો → Permissions: **Contents: Read and write**.
3. Owner / Repo / Branch + Token ભરો → **Connect**.
   - 🔒 ટોકન **ફક્ત આ ટેબની મેમરીમાં** રહે છે — ક્યાંય સેવ થતું નથી, પબ્લિક કોડમાં ક્યારેય ન મૂકો.
4. **ફાઈલ અપલોડ:** PDF/PPT/DOC/HTML/Image પસંદ કરો → `uploads/...` ફોલ્ડરમાં Git Data API થી commit થશે → URL આપોઆપ ભરાશે.
5. **પોસ્ટ/મટીરિયલ:** શીર્ષક (3 ભાષા), પ્રકાર, ધોરણ, વિષય, વર્ણન, ઈમેજ, ફાઈલ URL અથવા **YouTube લિંક** → Save → `data/catalog.json` અપડેટ થશે.
6. **AdSense:** Publisher ID + Slot ID ભરો → Save → `data/site-config.json` અપડેટ.
7. **ફાઈલ મેનેજર:** `uploads/` ની બધી ફાઈલો જુઓ / ડિલીટ કરો.

---

## 🔐 Register / Login (Firebase)

GitHub Pages static છે, તેથી વાસ્તવિક એકાઉન્ટ માટે **Firebase Auth** વાપરો:

1. [Firebase Console](https://console.firebase.google.com) → નવું Project બનાવો.
2. **Authentication → Sign-in method → Email/Password** ચાલુ કરો.
3. Project Settings → **Web App** ઉમેરો → `apiKey` મળશે.
4. `data/site-config.json` (અથવા `js/config.js`) માં ભરો:
   ```json
   "firebase": { "apiKey": "તમારી-API-KEY", "authDomain": "xxx.firebaseapp.com" }
   ```
5. Firebase Console → **Authentication → Authorized domains** માં તમારું Pages ડોમેન ઉમેરો.

> `apiKey` ખાલી હોય તો **Demo Mode** ચાલશે (localStorage) — માત્ર ટેસ્ટિંગ માટે, વાસ્તવિક સુરક્ષા નથી.

---

## 💰 AdSense — વધુ આવક માટેની સેટિંગ

- Admin Panel માંથી Publisher ID + 4 Slot ID ભરો (Home Top, Home Mid, Sidebar, Content Bottom).
- પ્લેસમેન્ટ **પોલિસી-સેફ** છે: દરેક જાહેરાત પર "Advertisements" લેબલ, ડાઉનલોડ/પ્લે બટનથી દૂર, ગેમથી ≥150px અંતર, iframe/પોપ-અપ જાહેરાત નથી.
- ⚠️ AdSense મંજૂરી અને આવકની ગેરંટી કોઈ આપી શકે નહીં — પોલિસી પાળવી જરૂરી છે.

---

## 📁 પ્રોજેક્ટ સ્ટ્રક્ચર

```
index.html            — શેલ (header, sidebar, footer)
styles.css            — પ્રીમિયમ UI + ડાર્ક મોડ
js/
  config.js           — સાઈટ કોન્ફિગ (Firebase/AdSense/GitHub)
  i18n.js             — ગુજરાતી/હિન્દી/English શબ્દકોશ
  catalog.js          — ડેટા લેયર
  auth.js             — Firebase REST + Demo Mode
  games.js            — 3 બિલ્ટ-ઈન ગેમ્સ
  github.js           — GitHub API (Contents + Git Data)
  admin.js            — Admin Panel
  app.js              — રાઉટર + પેજ રેન્ડરિંગ
data/
  catalog.json        — બધું મટીરિયલ (Admin Panel થી અપડેટ થાય)
  site-config.json    — રનટાઈમ કોન્ફિગ (AdSense/Firebase)
assets/fonts/         — Noto Gujarati/Devanagari, Inter, Baloo Bhai 2
blogger/
  OEG-Blogger-Theme.xml — Blogger upload થીમ
uploads/              — Admin Panel થી અપલોડ થતી ફાઈલો (GitHub માં)
scripts/build.mjs     — ફોન્ટ્સ કોપી સ્ક્રિપ્ટ
```

---

## 🧪 લોકલ ટેસ્ટ

```bash
npm install
npm run build          # ફોન્ટ્સ assets/fonts/ માં કોપી
npm start              # http://localhost:8080
```

---

## 📌 મહત્વની નોંધો

- **કોપીરાઈટ:** GCERT પાઠ્યપુસ્તકોની PDF અહીં હોસ્ટ નથી — સત્તાવાર GCERT/DIKSHA લિંક્સ આપી છે. તમારી પોતાની/પરમિશન વાળી ફાઈલો Admin Panel થી અપલોડ કરો.
- **GitHub Pages લિમિટ:** સાઈટ ≤1GB, બેન્ડવિડ્થ ~100GB/માસ (soft).
- **ટોકન સુરક્ષા:** PAT ક્યારેય પબ્લિક કોડ/રિપોમાં ન મૂકો.
