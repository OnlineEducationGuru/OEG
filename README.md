# 🎓 Online Education Guru (OEG)

બાલવાટિકાથી ધોરણ 8 સુધીના વિદ્યાર્થીઓ, શિક્ષકો અને આચાર્યો માટેનું **પ્રીમિયમ શૈક્ષણિક પ્લેટફોર્મ** —
**GitHub Pages** પર હોસ્ટ થાય છે અને **Blogger (blogspot.com)** માં live embed થાય છે.

> **ભાષાઓ:** ગુજરાતી •िन्दी • English (એક ક્લિકમાં બદલાય) | **ડાર્ક મોડ** | **PWA-ready**

---

## ✨ ફિચર્સ

| વિભાગ | શું મળશે |
|---|---|
| 📚 **પાઠ્યપુસ્તક** | બાલવાટિકા + ધોરણ 1–8, દરેક ધોરણ અલગ, વિષય ફિલ્ટર |
| 📝 **સ્વાધ્યાયપોથી** | ધોરણ 1–5 અને 6–8 અલગ સંગ્રહ |
| 🎮 **શૈક્ષણિક રમત (Game Zone)** | 3 બિલ્ટ-ઈન ગેમ્સ (ક્વિઝ, મેમરી મેચ, ગણિત ચેલેન્જ) + અપલોડેડ HTML ગેમ્સ |
| 🗂️ **Office Documents** | PDF / DOC / PPT / HTML / Image — બધું સાઈટમાં જ વ્યૂઅર (ડાઉનલોડ નહીં) |
| 👩‍🏫 **Teachers Helper** | પાઠ આયોજન, પ્રશ્નપત્ર નમૂના વગેરે |
| 🧑‍🎓 **Students** | ગૃહકાર્ય પ્લાનર વગેરે |
| ▶️ **વિડિયો** | YouTube લિંક → એ જ પેજ પર પ્લેયર (youtube-nocookie embed) |
| 📰 **બ્લોગ / પોસ્ટ** | ઈમેજ + ફાઈલ વ્યૂઅર સાથે પોસ્ટ |
| 🔗 **ઉપયોગી લિંક્સ** | GCERT, DIKSHA, GSEB, GSBSTB + લોકપ્રિય શિક્ષક બ્લોગ્સ |
| 🔐 **Register / Login** | શિક્ષક / વિદ્યાર્થી / આચાર્ય — ખાતાં GitHub (users.json) માં, Firebase વગર |
| 🛠️ **Admin Panel** | GitHub માં ફાઈલ અપલોડ, પોસ્ટ એડિટર, વિડિયો, AdSense સેટિંગ, ફાઈલ મેનેજર |
| 📤 **શેર** | WhatsApp / Facebook / X / Telegram + લિંક કોપી |
| 💰 **AdSense** | દરેક પેજ પર પોલિસી-સેફ સ્લોટ (14 જગ્યા) + Publisher ID ભરો એટલે સ્ક્રિપ્ટ આપોઆપ |
| 🧠 **ઓનલાઇન ક્વિઝ** | કેટેગરી + ધોરણ મુજબ પ્રશ્નો (4 વિકલ્પ, સાચું/ખોટું તરત દેખાય, સમય, streak) — પાસ થાઓ તો **Online Education Guru સહી કરેલું પ્રમાણપત્ર** |
| 🎓 **ધોરણ પાનું** | ધોરણ ક્લિક કરો એટલે **બધાં પ્રકારનું** મટિરિયલ + એ ધોરણના **૭ વિષય** (ગુજરાતી, English, હિન્દી, ગણિત, વિજ્ઞાન, સામાજિક વિજ્ઞાન, **સંસ્કૃત**) |
| 🏷️ **શ્રેણી / ધોરણ / સબ-કેટેગરી** | Admin માંથી ઉમેરો કે કાઢી નાખો (ડુપ્લિકેટ હોય તો સ્પષ્ટ સંદેશ) |

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

> 🔒 **એક્સેસ:** Admin Panel **ફક્ત એક જ email+પાસવર્ડથી** ખુલે છે, જે `data/admin.json` માં **email = base64** + **પાસવર્ડ = SHA-256 hash** સ્વરૂપે સુરક્ષિત સેવ છે (કોઈ પણ ભાષક ફાઈલ વાંચે તો email/પાસવર્ડ સીધા દેખાતા નથી).

1. **Admin ખોલવું:** ટબ મેનુ → **વધુ ▾ → Admin Panel** (અથવા URL માં `#/admin`).
2. **પ્રથમ વખત (setup):** email + તમારો નવો પાસવર્ડ + **એકવાર સિક્રેટ કોડ** ભરો → **દાખલ થાઓ**.
   - 🔑 **સિક્રેટ કોડ = GitHub Fine-grained PAT** — login card પર ક્યાંય "GitHub/PAT/token" લખ્યું દેખાતું નથી; સમજ **લોગિન પછી** Panel → 🔗 Connect માં "❓ સિક્રેટ કોડ ક્યાંથી મેળવવો?" પર મળશે (README માં પણ છે).
   - પગલાં: https://github.com/settings/personal-access-tokens → **Generate new token → Fine-grained** → name `OEG`, 90 days → **Only select repositories** = `OnlineEducationGuru/OEG` → **Contents: Read and write** → Generate → copy.
3. **બીજી વારથી:** ફક્ત email + પાસવર્ડ. (કોઈ auto-fill નહીં — નીચે જુઓ.) સિક્રેટ કોડ પહેલી વાર ભરેલો હોય તો આપોઆપ લાગુ થાય — વારંવાર copy-paste કરવાનો પ્રશ્ન જ નથી (જુઓ: 📱 નીચેનો ભાગ).
4. **પાસવર્ડ ભૂલી જાઓ?** login card પર "🔑 સિક્રેટ કોડથી સેટઅપ / પાસવર્ડ બદલવો છે?" ક્લિક → નવો પાસવર્ડ + એકવાર સિક્રેટ કોડ → ફાઈલ આપોઆપ નવા hash થી લખાય.
5. **પાસવર્ડ/email બદલવાના 2 રસ્તા:**
   - **Panel → 🛡️ એક્સેસ કંટ્રોલ** → નવું email/પાસવર્ડ → Save (તરત base64+hash થઈ સેવ).
   - **સીધું GitHub પર** `data/admin.json` edit કરો:
     ```json
     { "v": 2, "email": "<base64(email)>", "pass": "<sha256(password)>", "updated": "2026-11-13" }
     ```
     અથવા સરળતા માટે `"pass": "મારો નવો પાસવર્ડ"` (plain) લખો — site hash તરીકે ઓળખી શકે અને plain હોય તો પણ login ચાલે; પછી પહેલી login વખતે આપોઆપ hash થઈ જાય. જૂનું `"passHash"` field પણ ચાલે (back-compatible).
6. 🔓 **Login પછી** upload/post/settings ચાલે (ફક્ત એ જ ટેબની memory માં કોડ રહે).
7. **🎬 YouTube — ફક્ત લિંક:** Panel → 🎬 માં `https://youtu.be/xxxx` (અથવા watch લિંક) પેસ્ટ કરો એટલે
   **શીર્ષક + થંબનેલ આપોઆપ** આવે (YouTube oEmbed) → ધોરણ/વિષય પસંદ કરી **Save**. સાઈટ પર કાર્ડમાં થંબનેલ દેખાય અને
   ક્લિક કરતાં **વિડિયો અમારા જ પેજમાં ચાલે** (ડાઉનલોડ/બહાર જવું નહીં).
8. **🗂️ આઇટમ મેનેજર:** Panel → 🗂️ માં દરેક પોસ્ટ/પાઠ/વિડિયો શોધી **✏️ સુધારો** કે **🗑 કાઢી નાખો**
   (કાઢી નાખવાથી `data/catalog.json` માંથી જતું રહે અને સાઈટ તરત અપડેટ થાય). ફાઈલ ડિસ્ક પરથી કાઢી નાખવી હોય તો 📁 File Manager.
9. **🏷️ શ્રેણી/ધોરણ/ક્વિઝ સબ-કેટેગરી:** નવી key+label+icon ભરી **ઉમેરો**; પહેલેથી હોય એવી key/label આપશો તો
   **“આ પહેલેથી જ ઉમેરાયેલું છે”** સંદેશ દેખાય (ડુપ્લિકેટ સેવ થતું નથી). કાઢી નાખતી વખતે એ શ્રેણી/ધોરણ કોઈ આઇટમમાં વપરાતું હોય તો
   સાવચેતી સંદેશ આવે (ડેટા તૂટે એવું થતું નથી). બધું `data/site-config.json → taxonomy` માં સેવ થાય.
10. **🧠 ક્વિઝ મેનેજર:** કેટેગરી + ધોરણ + અઘણતા પસંદ કરો → પ્રશ્ન + **૪ વિકલ્પ** + સાચો વિકલ્પ (A/B/C/D radio) → **🌐** થી ત્રણ ભાષા આપોઆપ →
    **➕ પ્રશ્ન ઉમેરો**. નીચેની યાદીમાંથી **🗑** થી પ્રશ્ન કાઢી નાખો. પાસ માર્ક (%) અને પ્રશ્ન દીઠ સમય અહીંથી બદલાય (`data/quiz.json`).

### 🔒 Admin login ની વધુ સુરક્ષા
- login card **email prefill કરતું નથી** અને **browser autofill/password-manager band** છે (`autocomplete="off"` + focus સુધી `readonly`) → public computer પર ક્લિક કરો તો પણ વિગતો આપોઆપ ન ભરાય.
- "Fine-grained PAT", `github_pat_...` જેવા કોઈ શબ્દ/placeholder વિઝિટરને દેખાતા નથી — ફક્ત "સિક્રેટ કોડ".
- 🛡️ **ભાષા/ટેક્સ્ટ સુરક્ષા (round-trip fix):** GitHub પરથી ફાઈલ વાંચતી વખતે UTF-8 સાવધાનીથી decode થાય (અગાઉ Gujarati text "mojibake" થઈ જતો — હવે `getFile` માં TextDecoder + જૂની corrupt data માં auto-repair).

## 🔐 વિદ્યાર્થી / શિક્ષક / આચાર્ય Register-Login (Firebase ની જરૂર નથી)

બધાં વિદ્યાર્થી/શિક્ષક/આચાર્ય/અન્ય નાં ખાતાં **GitHub ની `data/users.json`** માં સેવ થાય છે — કોઈ server/Firebase નહીં.

- **રજિસ્ટ્રેશન** (site પર): નામ+ઈમેઈલ+પાસવર્ડ+ભૂમિકા ભરો → વિનંતી નોંધાય → **"Admin ને મોકલો"** બટન (WhatsApp/Email) → Admin મંજૂર કરે એટલે login ચાલુ.
  *(Static site માં visitors પોતે GitHub માં લખી શકે નહીં — એટલે મંજૂરી પગલું; અંતે વિગતો GitHub માં જ સેવ થાય.)*
- **Admin મંજૂરી:** Admin Panel → **👥 વપરાશકર્તાઓ** → વિગત ભરી ➕ → `users.json` commit → વિદ્યાર્થી login કરી શકે.
- **લોગિન:** બધા માટે free (કોઈ token નહીં) — પાસવર્ડ hash+salt થઈ સેવ, plain text ક્યાંય નહીં.
- ⚠️ `users.json` public repo માં છે — નબળા/બીજી site ના પાસવર્ડ વાપરવાનું કહો.
- 🔥 ઈચ્છો તો Firebase પણ ચાલુ રહે છે: `site-config.json` → `firebase.apiKey` ભરો.

---

## 📱 સિક્રેટ કોડ (GitHub PAT) ક્યાં સેવ છે?

**કોઈ પણ GitHub ફાઈલમાં નહીં** — repo, `data/*.json`, commit history કે source કોડમાં એ કોડ લખાતો નથી (એટલે કોઈ શોધી શકે નહીં).

- પહેલી વાર તમે Panel → 🔗 Connect માં (અથવા login card માં) કોડ ભરો અને **"આ કોડ ફક્ત આ બ્રાઉઝરમાં સુરક્ષિત રાખો"** ચેક રાખો (default ચાલુ) → કોડ **AES-256-GCM** થી એન્ક્રિપ્ટ થઈ તમારા બ્રાઉઝરના `localStorage` માં રહે છે.
- એન્ક્રિપ્શન key એ જ બ્રાઉઝરમાં છુપાયેલા અલગ random device-key માંથી બને છે → બીજા ફોન/PC પર એ જ blob ખોલો તો પણ **વાંચી ન શકાય**.
- બ્રાઉઝરની storage ખોલો તો પણ `oeg.v.9f2c` નામના opaque key હેઠળ ગબડતું random text દેખાય (કોડ સીધો દેખાતો નથી).
- Tab બંધ કરો તો પણ **આવતી વખતે email + પાસવર્ડ જ ભરવો** — કોડ આપોઆપ લાગુ થાય, upload/post કામ ચાલુ રહે (page reload દરમિયાન tab-cache કામ કરે છે).
- 🔓 Admin login થયા પછી Panel માં "💾 આ ઉપકરણ પર સેવ ✔" દેખાય; જાહેર/બીજા computer પર હોય તો **"🗑️ ભૂલી જાઓ"** દબાવો (અથવા remember checkbox uncheck કરો).
- logout/lock કરો એટલે tab-cache તરત કાઢી નાખાય.

> ⚠️ Web પર browser storage એટલે ફક્ત *તમારું ઉપકરણ* — એ computer નો બીજો વાપરનાર (અથવા malware) તમારી ખુલ્લી browser session વાપરી શકે. એટલે જાહેર/office PC પર remember બંધ રાખો।

---

## 🌐 Admin Panel ✍️ — એક ભાષા લખો, બાકીની આપોઆપ

- **✍️ નવી પોસ્ટ / મટીરિયલ** માં શીર્ષક (ગુજરાતી / હિન્દી / English) — **જે કોઈ એક ભાષામાં ભરો**; બાકીની બંને ભાષાઓ save વખતે આપોઆપ ભરાઈ જાય.
- **વર્ણન** અને **વિગતવાર લખાણ** પણ એ જ રીતે: એક ભાષામાં લખો, "લખાણ કઈ ભાષામાં છે?" select કરો → ત્રણેય ભાષામાં save થાય.
- **🌐 ભાષાંતર કરો** બટન = save પહેલાં preview (તમે બદલી પણ શકો). ભાષાંતર માટે free translation service વપરાય; નેટવર્ક ન મળે તો એ જ લખાણ બધી ભાષામાં મૂકાય (કંઈ ખાલી પડે નહીં).

---

## 💰 AdSense — દરેક પેજ પર જાહેરાત (વધુ આવક માટે)

- Admin Panel → 💰 માં **Publisher ID** (`ca-pub-…`) ભરો → સાઈટ **સ્ક્રિપ્ટ આપોઆપ `<head>` માં નાખે છે** (આપે `index.html` એડિટ કરવું પડે નહીં).
- **સ્લોટ:** `homeTop`, `homeMid`, `listTop`, `listMid`, `gradeTop`, `viewTop`, `viewMid`, `videoTop`, `quizTop`, `quizResult`, `gameTop`, `inFeed`, `contentBottom`, `sidebar` — **દરેક પેજ પર ક્યાં ને ક્યાં તો જાહેરાત બેસે જ** છે.
- Slot ID ખાલી હોય અને Publisher ID ભરેલું હોય તો **auto-format** (`data-ad-format="auto"`) વાપરાય — એટલે જગ્યા ખાલી રાખવી પડતી નથી.
- Publisher ID ખાલી હોય તો ખાલી ડબ્બો **વિઝિટરને દેખાતો નથી**; ફક્ત localhost/Admin માં ગોઠવણ દેખાય.
- મહત્તમ આવક માટે સૂચન: **homeTop + listMid + inFeed + viewMid + quizResult** (મોબાઇલ ટ્રાફિક અહીં વધુ), AMP નહીં, ad density ઓછું રાખો.
- ⚠️ **ઇમાનદારીની નોંધ:** મંજૂરી/આવકની ગેરંટી કોઈ આપી શકે નહીં — એ Google નો નિર્ણય છે. અમે તરફ સાઈટ **પોલિસી-સેફ** રાખી છે: “જાહેરાત” લેબલ, ડાઉનલોડ/પ્લે બટનથી દૂર, પોપ-અપ/ઇન્ટર્સ્ટિશિયલ નહીં, સાચો `robots.txt`, ગોપનીયતા માટે contact email. Panel માં 💰 નીચે પગલાંની યાદી છે.

---

## 🔎 SEO — Google માં ઉપર લાવવા

- દરેક રૂટ પર **title, description, canonical, Open Graph, Twitter card, JSON-LD** (WebSite / Organization / VideoObject / LearningResource / Quiz / ItemList / Breadcrumb) આપોઆપ લાગે છે — `js/meta.js`.
- **કેનોનિકલ + શેર લિંક હંમેશા અત્યારના host પ્રમાણે:** GitHub પરથી ⇒ `…github.io/OEG/#/view/<id>`, Blogger iframe માંથી ⇒ **તમારું `…blogspot.com/#/view/<id>`** (`?shareBase=` અથવા referrer થી). ક્યાંય `github.io` hard-code કરેલું નથી.
- **સ્ટેટિક (crawlable) પાનાં** — JS વગર પણ Google વાંચી શકે:
  - `p/<item-id>.html` — દરેક પાઠ/પોસ્ટ/વિડિયો (ત્રણેય ભાષામાં શીર્ષક+વર્ણન, વિડિયો હોય તો embed + થંબનેલ)
  - `g/<ધોરણ>.html` — ધોરણ પાનું (બધાં પ્રકાર + ૭ વિષય) · `g/all.html`
  - `q/<કેટેગરી>.html` — ક્વિઝ કેટેગરી પાનું · `q/all.html`
  - બનાવવા: `npm run seo` (અથવા `node scripts/seo.mjs`) પછી commit — `sitemap.xml` + `robots.txt` પણ અપડેટ.
- Admin → 🔎 SEO માં સાઈટનું શીર્ષક/વર્ણન/કીવર્ડ + `site verification` ભરો → save કરો એટલે `data/site-config.json` સાથે **sitemap.xml + robots.txt** પણ લખાય છે.
- બીજું કરવા જેવું (તમારું કામ): Search Console માં property add → sitemap submit → Blogger પોસ્ટમાં અહીંની લિંક આપો (backlink) → નવું મટિરિયલ નિયમિત મૂકો. **નવી સાઈટને ટોપ પર આવવા ૨–૮ અઠવાડિયાં લાગી શકે.**

---

## 🧠 ક્વિઝ + પ્રમાણપત્ર

- **રૂટ:** `#/quiz` (અથવા `#/quiz?cat=gk&grade=5` — ધોરણ પાનાં પરથી “ક્વિઝ આપો”).
- **બે ઘટક:** (1) *વિષય-ક્વિઝ* એટલે `#quiz` શ્રેણી હેઠળનું મટિરિયલ, (2) **પ્રશ્નોત્તરી ઇજન** — `data/quiz.json` માં ૩૩ પ્રશ્નો તૈયાર છે (gk/maths/science/social/gujarati/english/sanskrit/tat/htat/reasoning/current + ધોરણ મુજબ).
- **સ્ક્રીન:** કેટેગરી → ધોરણ → કેટલા પ્રશ્નો (5/10/15/બધા) → દરેક પ્રશ્ન **૪ વિકલ્પ**, સમય-અમલ (ડિફોલ્ટ ૪૫ સેકન્ડ), જવાબ આપતાં જ **લાલ/લસોટું (સાચું-ખોટું)** + સમજૂતી, સળંગ સાચાનો streak.
- **પરિણામ:** ટકા, સાચા/ખોટા, સમય, **પાસ માર્ક (ડિફોલ્ટ ૬૦%)**.
  - પાસ ⇒ **🏅 પ્રમાણપત્ર**: બ્રાન્ડેડ બોર્ડર, નામ (ટાઇપ કરી શકાય), કેટેગરી, સ્કોર, તારીખ, પ્રમાણપત્ર ક્રમાંક (OEG-XXXXXXX) અને **Online Education Guru સહી + મોહર**, 🖨 પ્રિન્ટ બટન (પ્રિન્ટ કરતી વખતે ફક્ત પ્રમાણપત્ર દેખાય).
  - નાપાસ ⇒ “ફરી પ્રયાસ કરો” સંદેશ + **🔄 ફરી રમો** + 📋 જવાબો તપાસો. પ્રમાણપત્ર લાગતું નથી.
- Admin → 🧠 માંથી પ્રશ્નો ઉમેરો/કાઢી નાખો, પાસ માર્ક/સમય બદલો અને સબ-કેટેગરી ઉમેરો/કાઢી નાખો.

---

## 🛡️ સાઈટ સુરક્ષા (કોપી-રોક)

સાઈટમાં એન્ટી-કોપી ગાર્ડ ચાલુ છે:

- **રાઈટ-ક્લિક બંધ** (context menu) + toast warning
- **ટેક્સ્ટ સિલેક્ટ/કોપી બંધ** (`user-select:none`, copy event રોકાયેલું) — ફોર્મ ફીલ્ડ્સ છૂટ છે
- **ઈમેજ ડ્રેગ બંધ**, **Ctrl+U / Ctrl+S / Ctrl+P / Ctrl+C / F12 / Ctrl+Shift+I** બ્લોક
- **ડાઉનલોડ બટન ક્યાંય નથી** — PDF/DOC/HTML/Image/લિંક/YouTube બધું **અમારા જ પેજમાં viewer માં** દેખાય (DOC માટે Office embed, લિંક સાઇટ iframe — સાઇટ embed બ્લોક કરે તો ↗ fallback)

> ⚠️ **ઇમાનદારીની નોંધ:** web પર કંઈ પણ 100% છુપાવી ન શકાય (view-source/cache થી બચાવ નહીં) — આ **મજબૂત deterrent** છે સામાન્ય વપરાશકર્તા માટે. ફાઈલો સૌથી સુરક્ષિત રાખવી હોય તો **પાસવર્ડ-પ્રોટેક્ટ PDF** વાપરો, અને ગ્રાફિક્સ બ્રાન્ડેડ રાખો.

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
scripts/seo.mjs       — સ્ટેટિક SEO પાનાં + sitemap.xml + robots.txt બિલ્ડર (npm run seo)
scripts/mkquiz.py     — data/quiz.json પાઈપ-ટેબલથી બનાવવાનું ટૂલ
p/ g/ q/              — બિલ્ડ થયેલાં સ્ટેટિક SEO પાનાં
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
