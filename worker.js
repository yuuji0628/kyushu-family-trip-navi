
function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
    ...init
  });
}

function html(body, init = {}) {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8", ...(init.headers || {}) },
    ...init
  });
}

function esc(v = "") {
  return String(v).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

function unauthorized() {
  return json({ error: "Unauthorized" }, { status: 401 });
}

function parseJsonArray(v) {
  try { return v ? JSON.parse(v) : []; } catch { return []; }
}

function normalizeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    area: row.area,
    category: row.category,
    icon: row.icon || "🧳",
    coverImage: row.coverImage || "",
    coverAlt: row.coverAlt || "",
    excerpt: row.excerpt || "",
    content: row.content || "",
    tags: parseJsonArray(row.tags),
    ageGroups: parseJsonArray(row.ageGroups),
    practical: parseJsonArray(row.practical),
    affiliate: {
      rakuten: row.affiliateRakuten || "",
      jalan: row.affiliateJalan || "",
      yahoo: row.affiliateYahoo || ""
    },
    seo: {
      metaDescription: row.seoMetaDescription || "",
      keywords: row.seoKeywords || ""
    },
    published: !!row.published,
    featured: !!row.featured,
    date: row.date || "",
    updatedAt: row.updatedAt || ""
  };
}

function requireAuth(request, env) {
  const password = request.headers.get("x-admin-password") || "";
  return !!env.ADMIN_PASSWORD && password === env.ADMIN_PASSWORD;
}

function payloadToParams(payload) {
  return {
    id: payload.id || crypto.randomUUID(),
    title: payload.title || "",
    area: payload.area || "fukuoka",
    category: payload.category || "spot",
    icon: payload.icon || "🧳",
    coverImage: payload.coverImage || "",
    coverAlt: payload.coverAlt || "",
    excerpt: payload.excerpt || "",
    content: payload.content || "",
    tags: JSON.stringify(payload.tags || []),
    ageGroups: JSON.stringify(payload.ageGroups || []),
    practical: JSON.stringify(payload.practical || []),
    affiliateRakuten: payload.affiliate?.rakuten || "",
    affiliateJalan: payload.affiliate?.jalan || "",
    affiliateYahoo: payload.affiliate?.yahoo || "",
    seoMetaDescription: payload.seo?.metaDescription || "",
    seoKeywords: payload.seo?.keywords || "",
    published: payload.published ? 1 : 0,
    featured: payload.featured ? 1 : 0,
    date: payload.date || new Date().toISOString().slice(0,10),
    updatedAt: new Date().toISOString().slice(0,10)
  };
}

const AREA_LABELS = {
  fukuoka: "福岡", saga: "佐賀", nagasaki: "長崎", kumamoto: "熊本",
  oita: "大分", miyazaki: "宮崎", kagoshima: "鹿児島"
};
const AREA_EMOJI = {
  fukuoka: "🍜", saga: "♨️", nagasaki: "⛵", kumamoto: "🐻",
  oita: "♨️", miyazaki: "🌴", kagoshima: "🌋"
};
const CATEGORY_LABELS = {
  hotel: "ホテル", spot: "観光", plan: "モデルコース", gourmet: "グルメ", tips: "お役立ち"
};

async function listArticles(db, opts = {}) {
  let sql = "SELECT * FROM articles";
  const where = [];
  const binds = [];
  if (opts.id) { where.push("id = ?"); binds.push(opts.id); }
  if (opts.area) { where.push("area = ?"); binds.push(opts.area); }
  if (opts.category) { where.push("category = ?"); binds.push(opts.category); }
  if (opts.featured) where.push("featured = 1");
  if (opts.published !== false) where.push("published = 1");
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY COALESCE(updatedAt, date) DESC, date DESC";
  const stmt = db.prepare(sql);
  const r = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
  return (r.results || []).map(normalizeRow);
}

function markdownLite(src = "") {
  const safe = esc(src);
  return safe
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

function layout(title, body, extraHead = "") {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
${extraHead}
<style>
:root{--ink:#18342d;--green:#168861;--green2:#0f6f50;--soft:#eef7f3;--line:#d8e6df;--muted:#6f817b;--cream:#fffaf0}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:#fff;line-height:1.7}
a{color:inherit}.wrap{max-width:1080px;margin:auto;padding:0 20px}.header{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.96);border-bottom:1px solid var(--line);backdrop-filter:blur(10px)}
.headerin{height:78px;display:flex;align-items:center;justify-content:space-between}.brand{font-weight:900;font-size:22px;text-decoration:none}.nav{display:flex;gap:22px}.nav a{text-decoration:none;font-weight:700}
.hero{background:linear-gradient(135deg,#edf8f3,#fff8e5);padding:72px 0}.hero h1{font-size:clamp(38px,7vw,72px);line-height:1.12;margin:10px 0}.hero h1 span{color:var(--green)}.lead{font-size:20px;color:var(--muted);max-width:760px}
.btns{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0}.btn{display:inline-block;padding:14px 22px;border-radius:14px;background:var(--green);color:#fff;text-decoration:none;font-weight:800;border:1px solid var(--green)}.btn.sub{background:#fff;color:var(--ink);border-color:var(--line)}
.chips{display:flex;gap:10px;flex-wrap:wrap}.chip{background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 14px}
.section{padding:64px 0}.section.soft{background:var(--soft)}.eyebrow{color:var(--green);font-weight:900;letter-spacing:.16em}.section h2{font-size:36px;margin:6px 0 26px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.card{border:1px solid var(--line);border-radius:24px;overflow:hidden;background:#fff}.cover{height:210px;background:linear-gradient(135deg,#e7f7f1,#fff2cf);display:flex;align-items:center;justify-content:center;font-size:72px}.cover img{width:100%;height:100%;object-fit:cover}
.pad{padding:24px}.badges{display:flex;gap:8px;flex-wrap:wrap}.badge{font-size:13px;font-weight:800;background:var(--soft);color:var(--green2);padding:5px 10px;border-radius:999px}.card h3{font-size:23px;line-height:1.45;margin:12px 0}.meta{font-size:14px;color:var(--muted)}
.areaGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.area{background:#fff;border:1px solid var(--line);border-radius:22px;padding:28px;text-align:center;text-decoration:none}.area .e{font-size:44px}
.article{max-width:820px;margin:auto;padding:48px 20px}.article h1{font-size:clamp(34px,6vw,56px);line-height:1.25}.article .heroimg{border-radius:24px;overflow:hidden;background:linear-gradient(135deg,#e7f7f1,#fff2cf);min-height:320px;display:flex;align-items:center;justify-content:center;font-size:92px}.article .heroimg img{width:100%;max-height:520px;object-fit:cover}.articleBody{font-size:18px}.articleBody h2{margin-top:38px}.affiliate{margin:36px 0;padding:24px;border:1px solid var(--line);border-radius:18px;background:#fbfffd}.affiliate a{display:inline-block;margin:6px 8px 6px 0;padding:10px 14px;border-radius:10px;background:var(--green);color:#fff;text-decoration:none;font-weight:700}
.footer{background:#16352c;color:#fff;padding:44px 0;margin-top:60px}
.filterbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}.filterbar a{padding:8px 12px;border:1px solid var(--line);border-radius:999px;text-decoration:none}
.login{max-width:520px;margin:70px auto;padding:28px;border:1px solid var(--line);border-radius:22px}.input,textarea,select{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font:inherit;background:#fff}.field{margin:14px 0}.admin{max-width:1000px;margin:40px auto;padding:0 20px}.panel{border:1px solid var(--line);border-radius:20px;padding:24px;margin:20px 0}.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.small{font-size:13px;color:var(--muted)}.status{padding:10px 14px;border-radius:10px;background:var(--soft);margin:12px 0}
@media(max-width:800px){.nav{display:none}.grid{grid-template-columns:1fr}.areaGrid{grid-template-columns:repeat(2,1fr)}.hero{padding:44px 0}.section{padding:46px 0}.row{grid-template-columns:1fr}}
</style>
</head><body>
<header class="header"><div class="wrap headerin">
<a class="brand" href="/">👨‍👩‍👧‍👦 九州ファミリー旅ナビ</a>
<nav class="nav"><a href="/">ホーム</a><a href="/articles.html">記事一覧</a><a href="/#areas">エリア</a><a href="/admin.html">管理</a></nav>
</div></header>
${body}
<footer class="footer"><div class="wrap"><b>九州ファミリー旅ナビ</b><div>子連れ九州旅行の情報メディア</div><div style="margin-top:18px">© 2026 九州ファミリー旅ナビ</div></div></footer>
</body></html>`;
}

function articleCard(a) {
  const area = AREA_LABELS[a.area] || a.area;
  const cat = CATEGORY_LABELS[a.category] || a.category;
  const visual = a.coverImage
    ? `<img src="${esc(a.coverImage)}" alt="${esc(a.coverAlt || a.title)}">`
    : esc(a.icon || "🧳");
  return `<article class="card">
    <div class="cover">${visual}</div>
    <div class="pad">
      <div class="badges"><span class="badge">${esc(area)}</span><span class="badge">${esc(cat)}</span></div>
      <h3>${esc(a.title)}</h3>
      <p>${esc(a.excerpt)}</p>
      <div class="meta">${esc(a.date)}</div>
      <p><a href="/article.html?id=${encodeURIComponent(a.id)}" style="color:var(--green);font-weight:800">続きを読む →</a></p>
    </div>
  </article>`;
}

async function homePage(env) {
  const featured = await listArticles(env.DB, { featured: true, published: true });
  const cards = featured.slice(0,6).map(articleCard).join("");
  const areas = Object.keys(AREA_LABELS).map(k =>
    `<a class="area" href="/articles.html?area=${encodeURIComponent(k)}"><div class="e">${AREA_EMOJI[k]}</div><b>${AREA_LABELS[k]}</b><div class="small">子連れスポットを探す</div></a>`
  ).join("");
  const body = `<section class="hero"><div class="wrap">
    <div class="eyebrow">九州の家族旅行を、もっとラクに。もっと楽しく。</div>
    <h1>子どもと一緒に<br><span>九州を遊びつくそう。</span></h1>
    <p class="lead">ホテル・観光スポット・食べ歩き・雨の日プランまで。パパママ目線で、子連れ旅行に本当に役立つ情報をまとめます。</p>
    <div class="btns"><a class="btn" href="/articles.html">おすすめ記事を見る</a><a class="btn sub" href="#areas">エリアから探す</a></div>
    <div class="chips"><span class="chip">🍼 赤ちゃん連れ</span><span class="chip">🛏️ 子連れホテル</span><span class="chip">☔ 雨の日OK</span></div>
  </div></section>
  <section class="section"><div class="wrap"><div class="eyebrow">FEATURED</div><h2>おすすめ記事</h2><div class="grid">${cards || "<p>公開記事はまだありません。</p>"}</div></div></section>
  <section class="section soft" id="areas"><div class="wrap"><div class="eyebrow">AREA</div><h2>エリアから探す</h2><div class="areaGrid">${areas}</div></div></section>`;
  return html(layout("九州ファミリー旅ナビ", body,
    '<meta name="description" content="九州の子連れ旅行に役立つホテル、観光、グルメ、モデルコース情報。">'));
}

async function articlesPage(env, url) {
  const area = url.searchParams.get("area") || "";
  const category = url.searchParams.get("category") || "";
  const rows = await listArticles(env.DB, { area: area || undefined, category: category || undefined, published: true });
  const areaFilters = ['<a href="/articles.html">すべて</a>'].concat(Object.keys(AREA_LABELS).map(k =>
    `<a href="/articles.html?area=${k}">${AREA_LABELS[k]}</a>`
  )).join("");
  const body = `<main class="section"><div class="wrap"><div class="eyebrow">ARTICLES</div><h2>記事一覧</h2>
  <div class="filterbar">${areaFilters}</div>
  <div class="grid">${rows.map(articleCard).join("") || "<p>該当する記事がありません。</p>"}</div>
  </div></main>`;
  return html(layout("記事一覧｜九州ファミリー旅ナビ", body,
    '<meta name="description" content="九州ファミリー旅ナビの記事一覧。子連れホテル、観光、グルメ、モデルコースを紹介。">'));
}

async function articlePage(env, url) {
  const id = url.searchParams.get("id");
  if (!id) return html("記事IDがありません", { status: 400 });
  const rows = await listArticles(env.DB, { id, published: true });
  const a = rows[0];
  if (!a) return html("記事が見つかりません", { status: 404 });
  const area = AREA_LABELS[a.area] || a.area;
  const cat = CATEGORY_LABELS[a.category] || a.category;
  const visual = a.coverImage
    ? `<img src="${esc(a.coverImage)}" alt="${esc(a.coverAlt || a.title)}">`
    : esc(a.icon || "🧳");
  const affiliateLinks = [
    a.affiliate.rakuten ? `<a rel="sponsored noopener" target="_blank" href="${esc(a.affiliate.rakuten)}">楽天トラベル</a>` : "",
    a.affiliate.jalan ? `<a rel="sponsored noopener" target="_blank" href="${esc(a.affiliate.jalan)}">じゃらん</a>` : "",
    a.affiliate.yahoo ? `<a rel="sponsored noopener" target="_blank" href="${esc(a.affiliate.yahoo)}">Yahoo!トラベル</a>` : ""
  ].join("");
  const tags = a.tags.map(t => `<span class="badge">${esc(t)}</span>`).join("");
  const body = `<main class="article">
    <div class="badges"><span class="badge">${esc(area)}</span><span class="badge">${esc(cat)}</span>${tags}</div>
    <h1>${esc(a.title)}</h1>
    <p class="meta">公開 ${esc(a.date)} / 更新 ${esc(a.updatedAt || a.date)}</p>
    <div class="heroimg">${visual}</div>
    <p class="lead" style="font-size:18px">${esc(a.excerpt)}</p>
    <div class="articleBody"><p>${markdownLite(a.content)}</p></div>
    ${affiliateLinks ? `<div class="affiliate"><b>旅行予約をチェック</b><div>${affiliateLinks}</div><div class="small">※リンクにはアフィリエイトを含む場合があります。</div></div>` : ""}
  </main>`;
  const desc = a.seo.metaDescription || a.excerpt || a.title;
  const keywords = a.seo.keywords || a.tags.join(",");
  const head = `<meta name="description" content="${esc(desc)}"><meta name="keywords" content="${esc(keywords)}"><meta property="og:title" content="${esc(a.title)}"><meta property="og:description" content="${esc(desc)}">`;
  return html(layout(a.title + "｜九州ファミリー旅ナビ", body, head));
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const db = env.DB;
  if (!db) return json({ error: "D1 binding DB is not configured" }, { status: 500 });

  if (request.method === "GET") {
    if (url.searchParams.get("health")) return json({ ok:true, storage:"d1" });
    if (url.searchParams.get("auth")) {
      if (!requireAuth(request, env)) return unauthorized();
      return json({ ok:true, authenticated:true });
    }
    const rows = await listArticles(db, {
      id: url.searchParams.get("id") || undefined,
      area: url.searchParams.get("area") || undefined,
      category: url.searchParams.get("category") || undefined,
      featured: url.searchParams.get("featured") === "1",
      published: url.searchParams.get("published") === "1" ? true : false
    });
    return json({ articles: rows });
  }

  if (!requireAuth(request, env)) return unauthorized();
  const payload = payloadToParams(await request.json());

  if (request.method === "POST") {
    await db.prepare(`INSERT OR REPLACE INTO articles (
      id,title,area,category,icon,coverImage,coverAlt,excerpt,content,tags,ageGroups,practical,
      affiliateRakuten,affiliateJalan,affiliateYahoo,seoMetaDescription,seoKeywords,published,featured,date,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      payload.id,payload.title,payload.area,payload.category,payload.icon,payload.coverImage,payload.coverAlt,
      payload.excerpt,payload.content,payload.tags,payload.ageGroups,payload.practical,payload.affiliateRakuten,
      payload.affiliateJalan,payload.affiliateYahoo,payload.seoMetaDescription,payload.seoKeywords,payload.published,
      payload.featured,payload.date,payload.updatedAt
    ).run();
    return json({ ok:true, article:(await listArticles(db,{id:payload.id,published:false}))[0] });
  }

  if (request.method === "PUT") {
    await db.prepare(`UPDATE articles SET
      title=?,area=?,category=?,icon=?,coverImage=?,coverAlt=?,excerpt=?,content=?,tags=?,ageGroups=?,practical=?,
      affiliateRakuten=?,affiliateJalan=?,affiliateYahoo=?,seoMetaDescription=?,seoKeywords=?,published=?,featured=?,date=?,updatedAt=?
      WHERE id=?`).bind(
      payload.title,payload.area,payload.category,payload.icon,payload.coverImage,payload.coverAlt,payload.excerpt,payload.content,
      payload.tags,payload.ageGroups,payload.practical,payload.affiliateRakuten,payload.affiliateJalan,payload.affiliateYahoo,
      payload.seoMetaDescription,payload.seoKeywords,payload.published,payload.featured,payload.date,payload.updatedAt,payload.id
    ).run();
    return json({ ok:true, article:(await listArticles(db,{id:payload.id,published:false}))[0] });
  }

  if (request.method === "DELETE") {
    await db.prepare("DELETE FROM articles WHERE id=?").bind(payload.id).run();
    return json({ ok:true });
  }

  return json({ error:"Method not allowed" }, { status:405 });
}

function adminPage() {
  const body = `<div id="loginBox" class="login">
    <h2>管理画面ログイン</h2>
    <p>Cloudflare Workers の ADMIN_PASSWORD を入力してください。</p>
    <div class="field"><input id="pw" class="input" type="password" placeholder="管理パスワード"></div>
    <button id="loginBtn" class="btn">ログイン</button>
    <div id="loginStatus" class="small"></div>
  </div>
  <main id="adminApp" class="admin" style="display:none">
    <h1>管理画面</h1>
    <div class="panel"><b>接続・運用状況</b><p>保存先：Cloudflare Workers / D1</p><p>認証状態：ログイン済み</p><button id="logoutBtn" class="btn sub">ログアウト</button></div>
    <div class="panel">
      <h2>記事編集</h2>
      <input id="id" type="hidden">
      <div class="row">
        <div class="field"><label>タイトル</label><input id="title" class="input"></div>
        <div class="field"><label>アイコン</label><input id="icon" class="input" value="🧳"></div>
      </div>
      <div class="row">
        <div class="field"><label>エリア</label><select id="area">${Object.keys(AREA_LABELS).map(k=>`<option value="${k}">${AREA_LABELS[k]}</option>`).join("")}</select></div>
        <div class="field"><label>カテゴリ</label><select id="category">${Object.keys(CATEGORY_LABELS).map(k=>`<option value="${k}">${CATEGORY_LABELS[k]}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>画像URL</label><input id="coverImage" class="input" placeholder="https://..."></div>
      <div class="field"><label>画像alt</label><input id="coverAlt" class="input"></div>
      <div class="field"><label>要約</label><textarea id="excerpt" rows="3"></textarea></div>
      <div class="field"><label>本文（## 見出し / - 箇条書き 対応）</label><textarea id="content" rows="10"></textarea></div>
      <div class="row">
        <div class="field"><label>タグ（カンマ区切り）</label><input id="tags" class="input"></div>
        <div class="field"><label>年齢（カンマ区切り）</label><input id="ageGroups" class="input"></div>
      </div>
      <div class="field"><label>実用情報（カンマ区切り）</label><input id="practical" class="input"></div>
      <h3>アフィリエイト</h3>
      <div class="field"><label>楽天トラベルURL</label><input id="rakuten" class="input"></div>
      <div class="field"><label>じゃらんURL</label><input id="jalan" class="input"></div>
      <div class="field"><label>Yahoo!トラベルURL</label><input id="yahoo" class="input"></div>
      <h3>SEO</h3>
      <div class="field"><label>meta description</label><textarea id="metaDescription" rows="2"></textarea></div>
      <div class="field"><label>keywords</label><input id="keywords" class="input"></div>
      <div class="row">
        <div class="field"><label><input id="published" type="checkbox" checked> 公開</label></div>
        <div class="field"><label><input id="featured" type="checkbox"> おすすめ</label></div>
      </div>
      <div class="btns"><button id="saveBtn" class="btn">保存</button><button id="newBtn" class="btn sub">新規入力</button></div>
      <div id="saveStatus" class="status">準備完了</div>
    </div>
    <div class="panel"><h2>記事一覧</h2><div id="articleList">読み込み中...</div></div>
  </main>
<script>
(function(){
  var password = sessionStorage.getItem("adminPassword") || "";
  var $ = function(id){ return document.getElementById(id); };
  function headers(){ return {"content-type":"application/json","x-admin-password":password}; }
  async function auth(pw){
    var r = await fetch("/api/articles?auth=1",{headers:{"x-admin-password":pw}});
    return r.ok;
  }
  async function boot(){
    if(password && await auth(password)){ $("loginBox").style.display="none"; $("adminApp").style.display="block"; loadArticles(); }
  }
  $("loginBtn").onclick = async function(){
    var pw = $("pw").value;
    $("loginStatus").textContent = "確認中...";
    if(await auth(pw)){ password=pw; sessionStorage.setItem("adminPassword",pw); $("loginBox").style.display="none"; $("adminApp").style.display="block"; loadArticles(); }
    else $("loginStatus").textContent = "パスワードが違います。";
  };
  $("logoutBtn").onclick = function(){ sessionStorage.removeItem("adminPassword"); location.reload(); };
  function csv(v){ return v.split(",").map(function(x){return x.trim();}).filter(Boolean); }
  async function loadArticles(){
    var r = await fetch("/api/articles");
    var d = await r.json();
    var list = d.articles || [];
    $("articleList").innerHTML = list.length ? list.map(function(a){
      return '<div style="padding:14px 0;border-bottom:1px solid #d8e6df"><b>'+a.title+'</b><div class="small">'+a.area+' / '+a.category+' / '+(a.published?'公開':'下書き')+'</div><button class="btn sub editBtn" data-id="'+a.id+'">編集</button> <button class="btn sub delBtn" data-id="'+a.id+'">削除</button></div>';
    }).join("") : "記事がありません。";
    Array.from(document.querySelectorAll(".editBtn")).forEach(function(b){ b.onclick=function(){ editArticle(b.dataset.id); }; });
    Array.from(document.querySelectorAll(".delBtn")).forEach(function(b){ b.onclick=function(){ deleteArticle(b.dataset.id); }; });
  }
  async function editArticle(id){
    var r=await fetch("/api/articles?id="+encodeURIComponent(id)); var d=await r.json(); var a=(d.articles||[])[0]; if(!a)return;
    $("id").value=a.id||""; $("title").value=a.title||""; $("icon").value=a.icon||"🧳"; $("area").value=a.area||"fukuoka"; $("category").value=a.category||"spot";
    $("coverImage").value=a.coverImage||""; $("coverAlt").value=a.coverAlt||""; $("excerpt").value=a.excerpt||""; $("content").value=a.content||"";
    $("tags").value=(a.tags||[]).join(", "); $("ageGroups").value=(a.ageGroups||[]).join(", "); $("practical").value=(a.practical||[]).join(", ");
    $("rakuten").value=(a.affiliate&&a.affiliate.rakuten)||""; $("jalan").value=(a.affiliate&&a.affiliate.jalan)||""; $("yahoo").value=(a.affiliate&&a.affiliate.yahoo)||"";
    $("metaDescription").value=(a.seo&&a.seo.metaDescription)||""; $("keywords").value=(a.seo&&a.seo.keywords)||"";
    $("published").checked=!!a.published; $("featured").checked=!!a.featured; scrollTo({top:0,behavior:"smooth"});
  }
  function payload(){
    return {id:$("id").value||undefined,title:$("title").value,icon:$("icon").value,area:$("area").value,category:$("category").value,
      coverImage:$("coverImage").value,coverAlt:$("coverAlt").value,excerpt:$("excerpt").value,content:$("content").value,
      tags:csv($("tags").value),ageGroups:csv($("ageGroups").value),practical:csv($("practical").value),
      affiliate:{rakuten:$("rakuten").value,jalan:$("jalan").value,yahoo:$("yahoo").value},
      seo:{metaDescription:$("metaDescription").value,keywords:$("keywords").value},
      published:$("published").checked,featured:$("featured").checked};
  }
  $("saveBtn").onclick=async function(){
    var p=payload(); var method=p.id?"PUT":"POST"; $("saveStatus").textContent="保存中...";
    var r=await fetch("/api/articles",{method:method,headers:headers(),body:JSON.stringify(p)});
    var d=await r.json().catch(function(){return {};});
    if(!r.ok){$("saveStatus").textContent="保存失敗: HTTP "+r.status+" "+(d.error||"");return;}
    $("saveStatus").textContent="保存しました。公開サイトへ即時反映されます。"; clearForm(); loadArticles();
  };
  $("newBtn").onclick=clearForm;
  function clearForm(){ ["id","title","coverImage","coverAlt","excerpt","content","tags","ageGroups","practical","rakuten","jalan","yahoo","metaDescription","keywords"].forEach(function(x){$(x).value="";}); $("icon").value="🧳"; $("published").checked=true; $("featured").checked=false; }
  async function deleteArticle(id){
    if(!confirm("この記事を削除しますか？")) return;
    var r=await fetch("/api/articles",{method:"DELETE",headers:headers(),body:JSON.stringify({id:id})});
    if(r.ok) loadArticles(); else alert("削除に失敗しました");
  }
  boot();
})();
</script>`;
  return html(layout("管理画面｜九州ファミリー旅ナビ", body, '<meta name="robots" content="noindex,nofollow">'));
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/articles") return await handleApi(request, env);
      if (url.pathname === "/__diag") {
        if (!env.DB) return json({ ok: false, error: "D1 binding DB is not configured" }, { status: 500 });
        const rows = await listArticles(env.DB, { featured: true, published: true });
        return json({ ok: true, storage: "d1", featuredCount: rows.length, ids: rows.map(x => x.id) });
      }
      if (url.pathname === "/" || url.pathname === "/index.html") return await homePage(env);
      if (url.pathname === "/articles.html") return await articlesPage(env, url);
      if (url.pathname === "/article.html") return await articlePage(env, url);
      if (url.pathname === "/admin.html") return adminPage();
      return html(layout("ページが見つかりません", '<main class="article"><h1>404</h1><p>ページが見つかりません。</p></main>'), { status:404 });
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, { status:500 });
    }
  }
};
