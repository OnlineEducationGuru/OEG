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
| 🔐 **Register / Login** | શિક્ષક / વિદ્યાર્થી / આચાર્ય — ખાતાં GitHub (users.json) માં, Firebase વગર |
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

> 🔒 **એક્સેસ:** Admin Panel **ફક્ત એક જ email+પાસવર્ડથી** ખુલે છે, જે `data/admin.json` માં સુરક્ષિત **SHA-256 hash** સ્વરૂપે સેવ છે.
> Admin નું કોઈ રજિસ્ટ્રેશન નથી — login પણ નહીં. અન્ય કોઈ પણ રીતે panel ખૂલશે નહીં.
> ⚠️ JSON ફાઈલોમાં edit કરતી વખતે દરેક value `" કોટ "` માં હોવી જોઈએ — ભૂલ થાય તો site પર warning દેખાશે.

1. સાઈટ ખોલો → menu → **Admin Panel** (અથવા `#/admin`).
2. **પ્રથમ વખત (setup):** email + તમારો નવો પાસવર્ડ + **એકવાર** GitHub **Fine-grained PAT** ભરો → **દાખલ થાઓ**.
   - PAT: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → Repository access: ફક્ત OEG → **Contents: Read and write**
   - આટલું કરતાં `data/admin.json` રિપોમાં સેવ થશે — હમજીતર Admin ખુલ્લું.
3. **બીજી વારથી:** ફક્ત email + પાસવર્ડ. ભૂલ કરો તો login page પર જ error દેખાશે.
4. પછી Panel માં: 🔗 **GitHub Connect** (ટોકન ફરી ભરો — tab memory માં જ રહે, ક્યાંય સેવ નહીં) → 📤 ફાઈલ અપલોડ, ✍️ પોસ્ટ, 💰 AdSense, 👥 વપરાશકર્તાઓ, 📁 ફાઈલ મેનેજર.
5. પાસવર્ડ બદલવા: Panel → **🛡️ એક્સેસ કંટ્રોલ** → નવો પાસવર્ડ → Save.

---

## 🔐 વિદ્યાર્થી / શિક્ષક / આચાર્ય Register-Login (Firebase ની જરૂર નથી)

બધાં વિદ્યાર્થી/શિક્ષક/આચાર્ય/અન્ય નાં ખાતાં **GitHub ની `data/users.json`** માં સેવ થાય છે — કોઈ server/Firebase નહીં.

- **રજિસ્ટ્રેશન** (site પર): નામ+ઈમેઈલ+પાસવર્ડ+ભૂમિકા ભરો → વિનંતી નોંધાય → **"Admin ને મોકલો"** બટન (WhatsApp/Email) → Admin મંજૂર કરે એટલે login ચાલુ.
  *(Static site માં visitors પોતે GitHub માં લખી શકે નહીં — એટલે મંજૂરી પગલું; અંતે વિગતો GitHub માં જ સેવ થાય.)*
- **Admin મંજૂરી:** Admin Panel → **👥 વપરાશકર્તાઓ** → વિગત ભરી ➕ → `users.json` commit → વિદ્યાર્થી login કરી શકે.
- **લોગિન:** બધા માટે free (કોઈ token નહીં) — પાસવર્ડ hash+salt થઈ સેવ, plain text ક્યાંય નહીં.
- ⚠️ `users.json` public repo માં છે — નબળા/બીજી site ના પાસવર્ડ વાપરવાનું કહો.
- 🔥 ઈચ્છો તો Firebase પણ ચાલુ રહે છે: `site-config.json` → `firebase.apiKey` ભરો.

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
  auth.js             — GitHub users.json આધારિત login (SHA-256) + optional Firebase
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
