/* ============================================================
   OEG YouTube — ફક્ત લિંક પરથી શીર્ષક + થંબનેલ (in-page play)
   કંઈ જ ડાઉનલોડ થતું નથી — embed પ્લેયર અહીંની પેજ પર બેસે
   ============================================================ */
OEG.yt = (() => {
  const cache = {};

  const idOf = (url) => OEG.youtubeId(url);
  const watch = (id) => "https://www.youtube.com/watch?v=" + id;
  const embed = (id) => "https://www.youtube-nocookie.com/embed/" + id + "?rel=0&modestbranding=1&playsinline=1";
  const thumb = (id, size) => "https://i.ytimg.com/vi/" + id + "/" + (size || "maxresdefault") + ".jpg";
  const bestThumb = (id) => thumb(id, "maxresdefault");

  async function jget(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(r.status + "");
    return r.json();
  }

  /* oEmbed → ન હોય તો noembed backup; બંધ નામ સાથે પણ કામ કરે */
  async function meta(url) {
    const id = idOf(url);
    if (!id) return { ok: false, error: "bad-url" };
    if (cache[id]) return Object.assign({ ok: true }, cache[id]);
    const out = { id: id, title: "", author: "", thumb: thumb(id, "hqdefault"), thumbBig: bestThumb(id), desc: "" };
    const tries = [
      () => jget("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(watch(id))),
      () => jget("https://noembed.com/embed?url=" + encodeURIComponent(watch(id)))
    ];
    for (const f of tries) {
      try {
        const j = await f();
        if (j && !j.error && (j.title || j.thumbnail_url)) {
          out.title = String(j.title || "").replace(/\s+/g, " ").trim();
          out.author = String(j.author_name || "").trim();
          out.thumbBig = j.thumbnail_url || out.thumbBig;
          out.thumb = out.thumbBig;
          break;
        }
      } catch (e) { /* આગળ વધો */ }
    }
    cache[id] = out;
    return Object.assign({ ok: true }, out);
  }

  /* પેસ્ટ કરેલી કોઈ પણ સ્ટ્રિંગમાંથી id (શુદ્ધ 11-અક્ષર id પણ ચાલે) */
  function parse(text) {
    const s = String(text || "").trim();
    if (!s) return null;
    if (/^[\w-]{11}$/.test(s)) return s;
    return idOf(s);
  }

  return { meta, parse, embed, thumb, bestThumb, watch, idOf };
})();
