# -*- coding: utf-8 -*-
"""Build data/quiz.json from a compact pipe table (one line per question).
Format: cat|grade|diff|stem_gu|stem_hi|stem_en|o1gu|o1hi|o1en|o2…|o3…|o4…|answer|ex_gu|ex_hi|ex_en
"""
import json, io, os
K = ["gu", "hi", "en"]

RAW = r"""
gk|all|easy|ભારતની રાજધાની કઈ છે?|भारत की राजधानी कौन सी है?|What is the capital of India?|નવી દિલ્હી|नई दिल्ली|New Delhi|મુંબઈ|मुंबई|Mumbai|અમદાવાદ|अहमदाबाद|Ahmedabad|ચેન્નાઈ|चेन्नई|Chennai|0|ભારતની રાજધાની નવી દિલ્હી છે.|भारत की राजधानी नई दिल्ली है।|New Delhi is the capital of India.
gk|all|easy|ગુજરાતની રાજધાની કઈ છે?|गुजरात की राजधानी कौन सी है?|What is the capital of Gujarat?|ગાંધીનગર|गांधीनगर|Gandhinagar|અમદાવાદ|अहमदाबाद|Ahmedabad|સુરત|सूरत|Surat|રાજકોટ|राजकोट|Rajkot|0|ગુજરાતની રાજધાની ગાંધીનગર છે.|गुजरात की राजधानी गांधीनगर है।|Gandhinagar is the capital of Gujarat.
gk|all|medium|ગુજરાતમાં વર્તમાન કેટલા જિલ્લા છે?|गुजरात में वर्तमान में कितने जिले हैं?|How many districts does Gujarat have now?|૩૩|33|33|૨૭|27|27|૩૦|30|30|૩૬|36|36|0|ગુજરાતમાં ૩૩ જિલ્લા છે.|गुजरात में 33 जिले हैं।|Gujarat has 33 districts.
gk|all|easy|ભારતનું રાષ્ટ્રીય પંક્ષી કયું છે?|भारत का राष्ट्रीय पक्षी कौन सा है?|Which is the national bird of India?|મોર|मोर|Peacock|કબૂતર|कबूतर|Pigeon|કાગડો|कागड़|Crow|હંસ|हंस|Swan|0|મોર ભારતનું રાષ્ટ્રીય પંક્ષી છે.|मोर भारत का राष्ट्रीय पक्षी है।|The peacock is India's national bird.
gk|all|medium|ગુજરાતનું સર્વોચ્ચ શિખર કયું છે?|गुजरात का सर्वोच्च शिखर कौन सा है?|Which is the highest peak of Gujarat?|ગુરુશિખર (માઉન્ટ આબૂ)|गुरुशिखर (माउंट आबू)|Guru Shikhar (Mount Abu)|ગિરનાર|गिरनार|Girnar|શત્રુંજય|शतरंजय|Shatrunjaya|મહીસમડી|महीसमड़ी|Mahismandal|0|ગુજરાતનું સર્વોચ્ચ શિખર ગુરુશિખર (૧૭૨૨ મી.) છે.|गुजरात का सर्वोच्च शिखर गुरुशिखर (1722 मी.) है।|Guru Shikhar (1722 m) is Gujarat's highest peak.
gk|all|medium|ભારતના બંધારણના મુખ્ય શિલ્પી કોણ કહેવાય?|भारत के संविधान के मुख्य निर्माता कौन कहलाते हैं?|Who is regarded as the chief architect of the Indian Constitution?|ડૉ. ભીમરાવ અમ્બેડકર|डॉ. भीमराव अंबेडकर|Dr. B. R. Ambedkar|મહાત્મા ગાંધી|महात्मा गांधी|Mahatma Gandhi|જવાહરલાલ નેહરુ|जवाहरलाल नेहरू|Jawaharlal Nehru|સરદાર વલ્લભભાઈ પટેલ|सरदार वल्लभभाई पटेल|Sardar Patel|0|બંધારણ સમિતિના અધ્યક્ષ ડૉ. અમ્બેડકર હતા.|संविधान सभा की प्रारूप समिति के अध्यक्ष डॉ. अंबेडकर थे।|Dr. Ambedkar chaired the Drafting Committee.
gk|5|easy|સામાન્ય વર્ષમાં કેટલા દિવસ હોય છે?|सामान्य वर्ष में कितने दिन होते हैं?|How many days are there in a normal year?|૩૬૫|365|365|૩૬૬|366|366|૩૬૦|360|360|૩૪૫|345|345|0|સામાન્ય વર્ષ ૩૬૫ અને લીપવર્ષ ૩૬૬ દિવસનો હોય.|सामान्य वर्ष 365 और अधिकम वर्ष 366 दिन का होता है।|A normal year has 365 days, a leap year 366.
gk|6|easy|સૌરમંડળનો સૌથી મોટો ગ્રહ કયો?|सौरमंडल का सबसे बड़ा ग्रह कौन सा है?|Which is the largest planet in the solar system?|ગુરુ|बृहस्पति|Jupiter|શનિ|शनि|Saturn|પૃથ્વી|पृथ्वी|Earth|મંગળ|मंगल|Mars|0|ગુરુ (Jupiter) સૌથી મોટો ગ્રહ છે.|बृहस्पति सबसे बड़ा ग्रह है।|Jupiter is the largest planet.
gk|all|easy|આપણા સૌથી નજીકનો તારો કયો?|हमारे सबसे निकट का तारा कौन सा है?|Which is the star nearest to us?|સૂર્ય|सूर्य|The Sun|ધ્રુવ તારો|ध्रुव तारा|Polaris|ચંદ્ર|चंद्र|The Moon|શુક્ર|शुक्र|Venus|0|સૂર્ય પૃથ્વીનો સૌથી નજીકનો તારો છે (ચંદ્ર તારો નથી).|सूर्य पृथ्वी के सबसे निकट का तारा है।|The Sun is the nearest star to Earth.
maths|3|easy|૭ × ૮ = ?|७ × ८ = ?|7 × 8 = ?|૫૬|56|56|૫૪|54|54|૬૩|63|63|૪૮|48|48|0|૭ × ૮ = ૫૬|७ × ८ = ५६|7 × 8 = 56
maths|5|easy|૧૪૪ નું વર્ગમૂળ કેટલું?|144 का वर्गमूल क्या है?|What is the square root of 144?|૧૨|12|12|૧૪|14|14|૧૬|16|16|૧૧|11|11|0|૧૨ × ૧૨ = ૧૪૪|१२ × १२ = १४४|12 × 12 = 144
maths|7|medium|બાજુ ૯ સેમી હોય તેવા ચોરસની પરિમિતિ?|भुजा 9 सेमी वाले वर्ग का परिमाप क्या है?|What is the perimeter of a square with side 9 cm?|૩૬ સેમી|36 सेमी|36 cm|૮૧ સેમી|81 सेमी|81 cm|૧૮ સેમી|18 सेमी|18 cm|૨૭ સેમી|27 सेमी|27 cm|0|પરિમિતિ = ૪ × ૯ = ૩૬ સેમી|परिमाप = 4 × 9 = 36 सेमी|Perimeter = 4 × 9 = 36 cm
maths|4|easy|૩/૪ ને દશાંશમાં લખો.|3/4 को दशमलव में लिखें।|Write 3/4 as a decimal.|૦.૭૫|0.75|0.75|૦.૩૪|0.34|0.34|૦.૭૪|0.74|0.74|૩.૪|3.4|3.4|0|૩ ÷ ૪ = ૦.૭૫|3 ÷ 4 = 0.75|3 ÷ 4 = 0.75
science|6|easy|છોડ પોતાનો ખોરાક કઈ પ્રક્રિયાથી બનાવે?|पौधे अपना भोजन किस प्रक्रिया से बनाते हैं?|By which process do plants make their food?|પ્રકાશસંશ્લેષણ|प्रकाश-संश्लेषण|Photosynthesis|શ્વસન|श्वसन|Respiration|બાષ્પોત્સર્જન|वाष्प-उत्सर्जन|Transpiration|પાચન|पाचन|Digestion|0|પાંદડાં સૂર્યપ્રકાશ લઈ પ્રકાશસંશ્લેષણથી ખોરાક બનાવે છે.|पत्ते सूर्यप्रकाश लेकर प्रकाश-संश्लेषण से भोजन बनाते हैं।|Leaves use sunlight to make food by photosynthesis.
science|8|easy|પાણીનું રાસાયણિક સૂત્ર શું?|पानी का रासायनिक सूत्र क्या है?|What is the chemical formula of water?|H₂O|H₂O|H₂O|CO₂|CO₂|CO₂|O₂|O₂|O₂|NaCl|NaCl|NaCl|0|પાણી = H₂O (બે હાઇડ્રોજન + એક ઑક્સિજન)|पानी = H₂O (दो हाइड्रोजन, एक ऑक्सीजन)|Water is H₂O — two hydrogen, one oxygen.
science|7|medium|માનવ શરીરમાં લોહી પંપ કોણ કરે?|मानव शरीर में रक्त कौन पंप करता है?|Which organ pumps blood in the human body?|હૃદય|हृदय|Heart|ફેફસું|फेफड़ा|Lung|કિડની|गुर्दा|Kidney|યકૃત|लिवर|Liver|0|હૃદય લોહી પંપ કરે છે; ફેફસું ઑક્સિજન પૂરો પાડે.|हृदय रक्त पंप करता है; फेफड़ा ऑक्सीजन देता है।|The heart pumps blood; the lungs supply oxygen.
social|5|easy|ભારત કયા ખંડમાં આવેલો?|भारत किस महाद्वीप में है?|In which continent is India?|એશિયા|एशिया|Asia|અફ્રિકા|अफ़्रीका|Africa|યુરોપ|यूरोप|Europe|ઓસ્ટ્રેલિયા|ऑस्ट्रेलिया|Australia|0|ભારત એશિયા ખંડમાં છે.|भारत एशिया महाद्वीप में है।|India lies in Asia.
social|7|medium|ભારતનું બંધારણ અમલમાં ક્યારે આવ્યું?|भारत का संविधान कब लागू हुआ?|When did the Indian Constitution come into force?|૨૬ જાન્યુઆરી ૧૯૫૦|26 जनवरी 1950|26 January 1950|૨૬ નવેમ્બર ૧૯૪૯|26 नवम्बर 1949|26 November 1949|૧૫ ઑગસ્ટ ૧૯૪૭|15 अगस्त 1947|15 August 1947|૨ ઑક્ટોબર ૧૯૫૦|2 अक्तूबर 1950|2 October 1950|0|બંધારણ ૨૬ નવેમ્બર ૧૯૪૯ ના રોજ અપનાવાયું, અમલ ૨૬ જાન્યુઆરી ૧૯૫૦ ના રોજ.|संविधान 26 नवम्बर 1949 को अपनाया गया, लागू 26 जनवरी 1950 को।|Adopted on 26 Nov 1949, it came into force on 26 Jan 1950.
gujarati|4|easy|«વન» શબ્દનો અર્થ શું?|'वन' शब्द का अर्थ क्या है?|What does the word 'વન' mean?|જંગલ|जंगल|Forest|પાણી|पानी|Water|ફૂલ|फूल|Flower|પહાડ|पहाड़|Hill|0|વન = જંગલ.|वन = जंगल।|'वन' means forest.
gujarati|6|medium|«વિદ્યાલય» શબ્દમાં કયો સમાસ?|'विद्यालय' शब्द में कौन-सा समास है?|Which samās is present in 'વિદ્યાલય'?|તત્પુરુષ|तत्पुरुष|Tatpuruṣa|દ્વિગુ|द्विगु|Dvigu|બહુવ્રીહિ|बहुव्रीहि|Bahuvrīhi|દ્વંદ્વ|द्वंद्व|Dvandva|0|વિદ્યા + આલય → વિદ્યાલય (તત્પુરુષ સમાસ).|विद्या + आलय → विद्यालय (तत्पुरुष)।|vidyā + ālaya → a tatpuruṣa compound.
english|5|easy|સાચી spelling પસંદ કરો.|सही वर्तनी चुनें।|Choose the correct spelling.|Teacher|Teacher|Teacher|Techer|Techer|Techer|Teachar|Teachar|Teachar|Teatcheer|Teatcheer|Teatcheer|0|સાચું સ્વરૂપ — Teacher.|सही रूप — Teacher।|The correct form is Teacher.
english|8|medium|Fill in the blank: She ___ to school every day.|Fill in the blank: She ___ to school every day.|Fill in the blank: She ___ to school every day.|goes|goes|goes|go|go|go|going|going|going|gone|gone|gone|0|Third person singular સાથે goes વપરાય.|Third person singular के साथ goes लगता है।|With 'she' we use 'goes'.
sanskrit|7|easy|«યોગ» શબ્દનો મુખ્ય અર્થ?|'योग' शब्द का मुख्य अर्थ क्या है?|What is the main meaning of 'योग'?|જોડાણ / મિલન|जोड़ / मिलन|Union|યુદ્ધ|युद्ध|War|ગતિ|गति|Motion|જ્ઞાન|ज्ञान|Knowledge|0|યોગ = જોડાણ (√યુજ્ ધાતુથી બનેલો).|योग = मिलन (√युज् से बना है)।|Yoga means union, from the root √yuj.
sanskrit|6|easy|«સૂર્ય» શબ્દનો પર્યાયવાચક કયો?|'सूर्य' का पर्यायवाची कौन सा है?|Which is a synonym of 'સૂર્ય' (Sun)?|રવિ|रवि|Ravi|શશી|शशी|Shashi|અનિલ|अनिल|Anila|પાવક|पावक|Pāvaka|0|રવિ / ભાનુ = સૂર્ય; શશી = ચંદ્ર, પાવક = અગ્નિ.|रवि = सूर्य; शशी = चंद्र; पावक = अग्नि।|Ravi means the Sun; Shashi is the Moon; Pāvaka is fire.
tat|all|medium|TAT પરીક્ષા મુખ્યત્વે કયા ધોરણની શિક્ષક ભરતી માટે?|TAT परीक्षा मुख्यतः किन कक्षाओं की शिक्षक भर्ती के लिए है?|The TAT exam is mainly for teacher recruitment to which classes?|ધોરણ ૧ થી ૮|कक्षा 1 से 8|Classes 1 to 8|ધોરણ ૯ થી ૧૨|कक्षा 9 से 12|Classes 9 to 12|ફક્ત બાલવાટિકા|केवल बालवाटिका|Balvatika only|કોલેજ સ્તર|कॉलेज स्तर|College level|0|TAT = ધોરણ ૧–૮ ના શિક્ષકોની ભરતી પરીક્ષા.|TAT = कक्षा 1–8 के शिक्षकों की भर्ती परीक्षा।|TAT is the recruitment test for teachers of classes I–VIII.
tat|all|medium|બાળક-કેન્દ્રિત શિક્ષણમાં સૌથી મહત્વનું?|बाल-केंद्रित शिक्षण में सबसे महत्वपूर्ण क्या है?|What matters most in child-centred teaching?|બાળકની સક્રિય ભૂમિકા|बालक की सक्रिय भूमिका|The child's active role|શિક્ષકનું એકતરફી પ્રવચન|शिक्षक का एकतरफा व्याख्यान|Only the teacher's lecture|પાઠ રટણ કરાવવો|पाठ रटवाना|Rote learning|સજા આપવી|सजा देना|Punishment|0|બાળક કેન્દ્રમાં રહે અને સક્રિયપણે શીખે.|बालक केंद्र में रहे और सक्रिय रूप से सीखे।|The child stays at the centre and learns actively.
tat|all|hard|શિક્ષણના અધિકારનો અનુચ્છેદ કયો?|शिक्षा के अधिकार का अनुच्छेद कौन सा है?|Which article deals with the right to education?|અનુચ્છેદ ૨૧(A)|अनुच्छेद 21(A)|Article 21(A)|અનુચ્છેદ ૧૯|अनुच्छेद 19|Article 19|અનુચ્છેદ ૩૨|अनुच्छेद 32|Article 32|અનુચ્છેદ ૩૭|अनुच्छेद 37|Article 37|0|અનુચ્છેદ ૨૧(A) — ૬ થી ૧૪ વર્ષના બાળકોનું મફત ફરજિયાત શિક્ષણ.|अनुच्छेद 21(A) — 6 से 14 वर्ष के बच्चों का निःशुल्क अनिवार्य शिक्षा।|Article 21(A) gives free, compulsory education for ages 6–14.
htat|all|medium|HTAT પરીક્ષા કયા સ્તરની શિક્ષક ભરતી માટે?|HTAT परीक्षा किस स्तर की शिक्षक भर्ती के लिए है?|HTAT is the recruitment test for teachers at which level?|ધોરણ ૯ થી ૧૨ (ઉચ્ચ માધ્યમિક)|कक्षा 9 से 12 (उच्च माध्यमिक)|Classes 9 to 12|ધોરણ ૧ થી ૫|कक्षा 1 से 5|Classes 1 to 5|પ્રી-પ્રાથમિક|प्री-प्राइमरी|Pre-primary|વિશ્વવિદ્યાલય|विश्वविद्यालय|University|0|HTAT = ઉચ્ચ માધ્યમિક (ધોરણ ૯–૧૨) શિક્ષક ભરતી પરીક્ષા.|HTAT = उच्च माध्यमिक (कक्षा 9–12) शिक्षक भर्ती परीक्षा।|HTAT is for higher-secondary (classes IX–XII) teachers.
reasoning|5|easy|શ્રેણી પૂરી કરો: ૨, ૪, ૮, ૧૬, ?|श्रेणी पूरी करें: 2, 4, 8, 16, ?|Complete the series: 2, 4, 8, 16, ?|૩૨|32|32|૨૪|24|24|૨૦|20|20|૩૦|30|30|0|દરેક સંખ્યા બમણી થાય છે — ૧૬ × ૨ = ૩૨.|हर संख्या दोगुनी होती है — 16 × 2 = 32।|Each number doubles, so 16 × 2 = 32.
reasoning|6|medium|AKC, BLD, CME, ? — આગલું શું?|AKC, BLD, CME, ? — आगे क्या आएगा?|AKC, BLD, CME, ? — what comes next?|DNF|DNF|DNF|DNE|DNE|DNE|END|END|END|FND|FND|FND|0|દરેક અક્ષર એક પગલું આગળ વધે છે → DNF.|हर अक्षर एक कदम आगे बढ़ता है → DNF।|Each letter moves one step forward → DNF.
current|all|easy|TAT અને HTAT શિક્ષક ભરતી પરીક્ષા કયા રાજ્યની?|TAT और HTAT शिक्षक भर्ती परीक्षा किस राज्य की हैं?|TAT and HTAT teacher recruitment tests belong to which state?|ગુજરાત|गुजरात|Gujarat|મહારાષ્ટ્ર|महाराष्ट्र|Maharashtra|રાજસ્થાન|राजस्थान|Rajasthan|કર્ણાટક|कर्नाटक|Karnataka|0|TAT અને HTAT ગુજરાતની શિક્ષક ભરતી પરીક્ષા છે.|TAT और HTAT गुजरात की शिक्षक भर्ती परीक्षाएँ हैं।|TAT and HTAT are Gujarat's teacher recruitment tests.
current|all|easy|ગુજરાતનાં શાળા પાઠ્યપુસ્તક કઈ સંસ્થા બનાવે?|गुजरात की पाठ्यपुस्तकें कौन सी संस्था बनाती है?|Which body prepares Gujarat's school textbooks?|GCERT|GCERT|GCERT|NCERT|NCERT|NCERT|UGC|UGC|UGC|NCTE|NCTE|NCTE|0|ગુજરાત રાજ્ય શિક્ષણ સંશોધન અને પ્રશિક્ષણ પરિષદ (GCERT) પાઠ્યપુસ્તક બનાવે છે.|गुजरात राज्य शिक्षण शोध एवं प्रशिक्षण परिषद (GCERT) पाठ्यपुस्तकें बनाती हैं।|GCERT prepares Gujarat's textbooks.
gk|1|easy|અંગ્રેજી વર્ણમાળામાં કેટલા અક્ષર?|अंग्रेज़ी वर्णमाला में कितने अक्षर होते हैं?|How many letters in the English alphabet?|૨૬|26|26|૨૪|24|24|૨૫|25|25|૨૭|27|27|0|અંગ્રેજીમાં ૨૬ અક્ષર (A–Z) હોય.|अंग्रेज़ी में 26 अक्षर (A–Z) होते हैं।|English has 26 letters, A to Z.
""".strip()

CATS = [
    ("grade", "🎓", "ધોરણ મુજબ|कक्षा अनुसार|By grade"),
    ("gk", "🌍", "સામાન્ય જ્ઞાન|सामान्य ज्ञान|General Knowledge"),
    ("maths", "➗", "ગણિત|गणित|Maths"),
    ("science", "🔬", "વિજ્ઞાન|विज्ञान|Science"),
    ("social", "🗺️", "સામાજિક વિજ્ઞાન|सामाजिक विज्ञान|Social Science"),
    ("gujarati", "📖", "ગુજરાતી|गुजराती|Gujarati"),
    ("english", "🔤", "English|English|English"),
    ("sanskrit", "🕉️", "સંસ્કૃત|संस्कृत|Sanskrit"),
    ("tat", "📝", "TAT (૧–૮)|TAT (1–8)|TAT (1–8)"),
    ("htat", "🏫", "HTAT (૯–૧૨)|HTAT (9–12)|HTAT (9–12)"),
    ("reasoning", "🧩", "તર્કશક્તિ|तर्कशक्ति|Reasoning"),
    ("current", "📰", "સમકાલીન|समकालीन|Current Affairs"),
]


def triple(parts):
    return dict(zip(K, parts))


def build():
    qs, seen = [], {}
    for line in RAW.split("\n"):
        p = [x.strip() for x in line.split("|")]
        assert len(p) == 22, (len(p), line[:60])
        cat, grade, diff = p[0], p[1], p[2]
        q = {"id": "", "cat": cat, "grade": grade, "diff": diff,
             "q": triple(p[3:6]),
             "opts": [triple(p[i:i + 3]) for i in (6, 9, 12, 15)],
             "a": int(p[18]), "ex": triple(p[19:22]), "marks": 1}
        assert 0 <= q["a"] <= 3, line[:60]
        n = seen.get(cat, 0) + 1
        seen[cat] = n
        q["id"] = "q-%s-%02d" % (cat, n)
        qs.append(q)
    return {
        "v": 1,
        "note": "Admin Panel → ક્વિઝ મેનેજ માંથી પ્રશ્નો ઉમેરો/કાઢી નાખો. cat = સબ-કેટેગરી; a = સાચા વિકલ્પનો ક્રમ (0–3).",
        "passPercent": 60,
        "seconds": 45,
        "cats": [{"key": k, "icon": i, "label": triple(l.split("|"))} for (k, i, l) in CATS],
        "questions": qs,
    }


if __name__ == "__main__":
    bank = build()
    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "quiz.json")
    io.open(out, "w", encoding="utf-8").write(json.dumps(bank, ensure_ascii=False, indent=2) + "\n")
    print("wrote", out, "with", len(bank["questions"]), "questions")
