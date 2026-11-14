/* ============================================================
   OEG Service Worker — સૂચના (notification) માટે જ
   ----------------------------------------------------
   GitHub Pages પર ચાલે (બ્લોગર પર SW બીજા origin માં નોંધાઈ શકે નહીં).
   ડેટા અહીં કૅશ કરાતો નથી — હંમેશા તાજું data/notice.json જ વાંચાય.
   ============================================================ */
const BASE = new URL(".", self.location).href;
/* SW માં localStorage નથી ⇒ ભાષા page તરફથી આવેલા મૂલ્ય માંથી જ (fallback: gu → en → hi) */
const lang = () => { try { return String((self.navigator && self.navigator.language) || "gu").slice(0, 2); } catch (e) { return "gu"; } };
const read = (o) => (o && typeof o === "object" ? (o[lang()] || o.gu || o.en || o.hi || "") : (o == null ? "" : String(o)));

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

/* page ⇒ SW: સૂચના બતાવો */
self.addEventListener("message", (ev) => {
  const d = (ev && ev.data) || {};
  if (d.type === "notify") {
    ev.waitUntil(self.registration.showNotification(String(d.title || "Online Education Guru"), {
      body: String(d.text || "").slice(0, 240),
      tag: "oeg-" + String(d.id || Date.now()),
      icon: BASE + "favicon.svg",
      badge: BASE + "favicon.svg",
      data: { url: d.url || "" }
    }));
    return;
  }
  if (d.type === "clear") {
    ev.waitUntil(self.registration.getNotifications().then((list) => list.forEach((n) => n.close())));
    return;
  }
  if (d.type === "ping") {
    ev.waitUntil(self.clients.matchAll().then((cs) => cs.forEach((c) => c.postMessage({ type: "check" }))));
  }
});

/* 🔔 સૂચના પર ટૅપ ⇒ એ પાનું ખૂલે (નવું tab જોઈએ તોયે ચાલે) */
self.addEventListener("notificationclick", (ev) => {
  ev.notification.close();
  const url = (ev.notification.data && ev.notification.data.url) || "";
  if (!url) return;
  ev.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const want = url.indexOf("#") >= 0 ? url.slice(url.indexOf("#")) : "";
    for (const c of cs) {
      if (!/^https?:/.test(url) || new URL(url).host === new URL(c.url).host) {
        if (want && c.navigate) { try { await c.navigate(url); await c.focus(); return; } catch (e) {} }
        await c.focus();
        if (want) { try { await c.navigate(url); return; } catch (e) {} }
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});

/* ⏱ પછી push service જોડવું હોય (VAPID/OneSignal) ⇒ એ જ અહીં બતાવાય */
self.addEventListener("push", (ev) => {
  let o = {};
  try { o = ev.data ? (ev.data.json() || {}) : {}; } catch (e) { o = { text: (ev.data && ev.data.text()) || "" }; }
  const title = read(o.title || o.site) || "Online Education Guru";
  ev.waitUntil(self.registration.showNotification(title, {
    body: read(o.text || o.body).slice(0, 240),
    tag: "oeg-" + String(o.id || Date.now()),
    icon: BASE + "favicon.svg",
    data: { url: o.url || "" }
  }));
});
