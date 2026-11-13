/* ============================================================
   OEG SEO — દરેક રૂટ પર title, description, canonical, OG,
   Twitter card, JSON-LD, hreflang + sitemap/robots બિલ્ડર
   ============================================================ */
OEG.seo = (() => {
  const setLink = (rel, href) => {
    if (!href) return;
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
    el.setAttribute("href", href);
  };
  const upsert = (tag, key, val, kind) => {
    if (!val) return;
    const sel = `${tag}[${kind}="${key}"]`;
    let el = document.head.querySelector(sel);
    if (!el) {
      el = document.createElement(tag);
      el.setAttribute(kind, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", val);
  };

  const seoCfg = () => Object.assign({}, (OEG.state.config || {}).seo || {});

  function ld(data) {
    let s = document.getElementById("oegJsonLd");
    if (!s) {
      s = document.createElement("script");
      s.id = "oegJsonLd";
      s.type = "application/ld+json";
      document.head.appendChild(s);
    }
    s.textContent = JSON.stringify(data);
  }

  /* ---------- પેજ પ્રમાણે meta ---------- */
  function apply(route, info) {
    const c = OEG.state.config || {}, S = seoCfg();
    const site = c.siteName || "Online Education Guru";
    const lang = OEG.state.lang || "gu";
    const tagline = OEG.langField(c.siteTagline) || "";
    info = info || {};
    const title = info.title || (route === "home" ? `${site} — ${tagline}` : `${info.pageTitle || OEG.t(info.key || "")} | ${site}`);
    const desc = (info.desc || S.description || OEG.langField(c.siteDesc) || tagline || "").slice(0, 200);
    const url = info.url || OEG.pageUrl();
    const img = info.image || OEG.thumbFrom(info.fileUrl) || c.ogImage || "";
    const kw = (info.keywords && info.keywords.length ? info.keywords.join(", ") : (S.keywords || "")).slice(0, 400);

    document.title = title.slice(0, 70);
    document.documentElement.lang = lang;
    upsert("meta", "description", desc, "name");
    if (kw) upsert("meta", "keywords", kw, "name");
    upsert("meta", "robots", "index, follow, max-image-preview:large, max-snippet:-1", "name");
    upsert("meta", "google-site-verification", S.siteVerification || "", "name");
    upsert("meta", "og:site_name", site, "property");
    upsert("meta", "og:title", title.slice(0, 95), "property");
    upsert("meta", "og:description", desc, "property");
    upsert("meta", "og:type", info.type || "website", "property");
    upsert("meta", "og:url", url, "property");
    upsert("meta", "og:image", img, "property");
    upsert("meta", "og:locale", lang === "gu" ? "gu_IN" : lang === "hi" ? "hi_IN" : "en_US", "property");
    upsert("meta", "twitter:card", img ? "summary_large_image" : "summary", "name");
    upsert("meta", "twitter:title", title.slice(0, 95), "name");
    upsert("meta", "twitter:description", desc, "name");
    upsert("meta", "twitter:image", img, "name");
    setLink("canonical", url);
    (document.head.querySelectorAll("link[rel='alternate'][hreflang]")).forEach((n) => n.remove());
    ["gu", "hi", "en"].forEach((l) => {
      const a = document.createElement("link");
      a.rel = "alternate";
      a.hreflang = l === "gu" ? "gu" : l;
      a.href = url + (url.indexOf("?") >= 0 ? "&" : "?") + "lang=" + l;
      document.head.appendChild(a);
    });

    /* ---------- JSON-LD ---------- */
    const base = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site,
      url: OEG.shareBase(),
      inLanguage: ["gu-IN", "hi-IN", "en-IN"][["gu", "hi", "en"].indexOf(lang)] || "gu-IN",
      publisher: { "@type": "EducationalOrganization", name: site, url: OEG.shareBase(), email: c.contactEmail || "" }
    };
    const graph = [base];
    if (info.item) {
      const it = info.item;
      graph.push({
        "@type": it.type === "video" ? "VideoObject" : it.type === "quiz" ? "Quiz" : "LearningResource",
        name: OEG.langField(it.title),
        description: OEG.langField(it.desc) || desc,
        url: url,
        thumbnailUrl: img || undefined,
        inLanguage: lang,
        educationalLevel: it.grade && it.grade !== "all" ? OEG.gradeLabel(it.grade) : undefined,
        learningResourceType: OEG.typeLabel(it.type),
        teaches: it.subject ? OEG.subjectLabel(it.subject) : undefined,
        publisher: base.publisher,
        isAccessibleForFree: true
      });
    } else if (info.items) {
      graph.push({
        "@type": "ItemList",
        name: title,
        numberOfItems: info.items.length,
        itemListElement: info.items.slice(0, 30).map((it, i) => ({
          "@type": "ListItem", position: i + 1,
          name: OEG.langField(it.title),
          url: OEG.shareUrl("#/view/" + it.id)
        }))
      });
    }
    if (route === "home") {
      graph.push({
        "@type": "Organization",
        name: site,
        url: OEG.shareBase(),
        logo: new URL("favicon.svg", location.href).href,
        sameAs: ["youtube", "facebook", "instagram", "telegram", "whatsapp"].map(k => (c.social || {})[k]).filter(Boolean),
        contactPoint: [{ "@type": "ContactPoint", email: c.contactEmail || "", contactType: "customer support", availableLanguage: ["gu", "hi", "en"] }]
      });
    }
    if (info.crumb) {
      graph.push({
        "@type": "BreadcrumbList",
        itemListElement: info.crumb.map((n, i) => ({ "@type": "ListItem", position: i + 1, name: n.name, item: n.url }))
      });
    }
    ld({ "@graph": graph });
  }

  /* ---------- sitemap / robots બિલ્ડર ---------- */
  function routes() {
    const list = [{ p: "", pri: "1.0", freq: "daily" }];
    const seen = {};
    OEG.tax().types.forEach(t => {
      if (t.route && !seen[t.route]) { seen[t.route] = 1; list.push({ p: "#/" + t.route, pri: "0.9", freq: "weekly" }); }
    });
    OEG.tax().grades.forEach(g => list.push({ p: "g/" + g.key + ".html", pri: "0.9", freq: "weekly" }));
    list.push({ p: "#/quiz", pri: "0.9", freq: "weekly" });
    OEG.tax().quizCats.forEach(c => list.push({ p: "q/" + c.key + ".html", pri: "0.8", freq: "weekly" }));
    OEG.state.catalog.forEach(it => list.push({ p: "p/" + it.id + ".html", pri: it.type === "post" ? "0.7" : "0.8", freq: "weekly" }));
    return list;
  }

  function sitemapXml(originPath) {
    const host = String(originPath || OEG.shareBase()).replace(/\/(index\.html)?$/, "");
    const day = new Date().toISOString().slice(0, 10);
    const urls = routes().map(r =>
      `  <url><loc>${host}/${r.p}</loc><lastmod>${day}</lastmod><changefreq>${r.freq}</changefreq><priority>${r.pri}</priority></url>`);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  }

  function robotsTxt(originPath) {
    const host = String(originPath || OEG.shareBase()).replace(/\/(index\.html)?$/, "");
    return `User-agent: *\nAllow: /\nDisallow: /#/admin\nDisallow: /admin\n\nSitemap: ${host}/sitemap.xml\n`;
  }

  /* સ્થિર (crawlable) પાનાં — p/<id>.html, g/<grade>.html, q/<cat>.html */
  const itemPage = (id) => "p/" + id + ".html";
  const gradePage = (g) => "g/" + g + ".html";
  const quizPage = (c) => "q/" + c + ".html";

  function init() {
    /* ?lang=gu|hi|en સપોર્ટ — Blogger/sharers માટે */
    try {
      const l = new URLSearchParams(location.search).get("lang");
      if (l && ["gu", "hi", "en"].includes(l) && l !== OEG.state.lang) {
        OEG.state.lang = l;
        localStorage.setItem("oeg-lang", l);
      }
    } catch (e) {}
  }

  return { apply, sitemapXml, robotsTxt, routes, itemPage, gradePage, quizPage, init };
})();
