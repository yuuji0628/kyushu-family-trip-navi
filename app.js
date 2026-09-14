
const AREA = {
  fukuoka:{name:'福岡', slug:'fukuoka', emoji:'🍜', desc:'街遊び・グルメ', page:'fukuoka.html'},
  saga:{name:'佐賀', slug:'saga', emoji:'♨️', desc:'温泉・自然', page:'saga.html'},
  nagasaki:{name:'長崎', slug:'nagasaki', emoji:'⛵', desc:'港町・テーマパーク', page:'nagasaki.html'},
  kumamoto:{name:'熊本', slug:'kumamoto', emoji:'🐻', desc:'阿蘇・市街地', page:'kumamoto.html'},
  oita:{name:'大分', slug:'oita', emoji:'♨️', desc:'温泉・動物', page:'oita.html'},
  miyazaki:{name:'宮崎', slug:'miyazaki', emoji:'🌴', desc:'海・南国', page:'miyazaki.html'},
  kagoshima:{name:'鹿児島', slug:'kagoshima', emoji:'🌋', desc:'桜島・離島', page:'kagoshima.html'}
};
const CATEGORY = {hotel:'ホテル', spot:'観光', gourmet:'グルメ', plan:'モデルコース'};
const PRACTICAL_ICON = {'駐車場あり':'🚗','授乳室あり':'🍼','ベビーカーOK':'🛒','キッズメニュー':'🍽️','屋内':'🏠'};
const STORE_KEY = 'kyushu-family-trip-navi-local-v2';
const ADMIN_KEY = 'kyushu-family-trip-navi-admin-password';
const API_BASE = '/api/articles';

const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const qs = new URLSearchParams(location.search);

function setMeta(name, content){
  let tag = document.querySelector(`meta[name="${name}"]`);
  if(!tag){ tag = document.createElement('meta'); tag.setAttribute('name', name); document.head.appendChild(tag); }
  tag.setAttribute('content', content);
}
function setCanonical(url){
  let tag = document.querySelector('link[rel="canonical"]');
  if(!tag){ tag = document.createElement('link'); tag.rel = 'canonical'; document.head.appendChild(tag); }
  tag.href = url;
}
function setupMenu(){
  const btn = $('.menu-btn');
  const nav = $('.main-nav');
  if(!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('no-scroll', open);
  });
}

async function fetchJson(url, options={}){
  const res = await fetch(url, options);
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getStaticArticles(){
  try{ return await fetchJson('articles.json'); }catch(e){ return []; }
}
function getLocalArticles(){
  try{ return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }catch(e){ return []; }
}
function saveLocalArticles(items){ localStorage.setItem(STORE_KEY, JSON.stringify(items)); }
function getAdminPassword(){ return sessionStorage.getItem(ADMIN_KEY) || ''; }
function setAdminPassword(v){ if(v) sessionStorage.setItem(ADMIN_KEY, v); else sessionStorage.removeItem(ADMIN_KEY); }

async function apiGetArticles(params={}){
  const q = new URLSearchParams(params);
  return await fetchJson(`${API_BASE}?${q.toString()}`);
}
async function apiMutate(method, payload){
  return await fetchJson(API_BASE, {
    method,
    headers:{'content-type':'application/json','x-admin-password': getAdminPassword()},
    body: JSON.stringify(payload)
  });
}
async function apiHealth(){
  try{
    const res = await fetch(`${API_BASE}?health=1`, {headers:getAdminPassword()?{'x-admin-password':getAdminPassword()}:{}});
    return {ok: res.ok, status: res.status};
  }catch(e){ return {ok:false, status:0}; }
}

async function getArticles(options={}){
  const mode = options.mode || 'published';
  const params = {};
  if(mode === 'published') params.published = '1';
  if(mode === 'all') params.all = '1';
  if(options.area) params.area = options.area;
  if(options.category) params.category = options.category;
  if(options.id) params.id = options.id;
  if(options.featured) params.featured = '1';
  try{
    const data = await apiGetArticles(params);
    if(Array.isArray(data.articles)) return data.articles;
  }catch(e){}
  const staticItems = await getStaticArticles();
  const localItems = getLocalArticles();
  const map = new Map();
  [...staticItems, ...localItems].forEach(item => map.set(item.id, item));
  let articles = [...map.values()];
  if(mode === 'published') articles = articles.filter(a => a.published);
  if(options.area) articles = articles.filter(a => a.area === options.area);
  if(options.category) articles = articles.filter(a => a.category === options.category);
  if(options.featured) articles = articles.filter(a => a.featured);
  if(options.id) articles = articles.filter(a => a.id === options.id);
  return articles.sort((a,b) => (b.date || '').localeCompare(a.date || ''));
}

function renderPractical(practical=[]){
  return (practical || []).slice(0,4).map(v => `<span>${PRACTICAL_ICON[v] || '✔'} ${esc(v)}</span>`).join('');
}
function renderTags(tags=[]){
  return (tags || []).slice(0,4).map(v => `<span>#${esc(v)}</span>`).join('');
}
function articleCard(a){
  return `<article class="article-card">
    <a class="article-card-media" href="article.html?id=${encodeURIComponent(a.id)}">
      <img src="${esc(a.coverImage || '')}" alt="${esc(a.coverAlt || a.title)}" loading="lazy">
      <div class="article-card-icon">${esc(a.icon || '🧳')}</div>
    </a>
    <div class="article-card-body">
      <div class="meta-row">
        <span class="chip">${esc(AREA[a.area]?.name || a.area)}</span>
        <span class="chip">${esc(CATEGORY[a.category] || a.category)}</span>
        <time>${esc(a.date || '')}</time>
      </div>
      <h3><a href="article.html?id=${encodeURIComponent(a.id)}">${esc(a.title)}</a></h3>
      <p>${esc(a.excerpt || '')}</p>
      <div class="tag-row">${renderTags(a.tags)}</div>
      <div class="practical-row">${renderPractical(a.practical)}</div>
      <div class="card-footer">
        <small>対象年齢：${esc((a.ageGroups || []).join(' / ') || '家族向け')}</small>
        <a href="article.html?id=${encodeURIComponent(a.id)}">続きを読む →</a>
      </div>
    </div>
  </article>`;
}

function markdownToHtml(text=''){
  return text.split('\n').map(line => {
    if(line.startsWith('### ')) return `<h3>${esc(line.slice(4))}</h3>`;
    if(line.startsWith('## ')) return `<h2>${esc(line.slice(3))}</h2>`;
    if(line.startsWith('- ')) return `<ul><li>${esc(line.slice(2))}</li></ul>`;
    return line.trim() ? `<p>${esc(line)}</p>` : '';
  }).join('').replace(/<\/ul>\s*<ul>/g,'');
}

function matchesSearch(a, keyword){
  if(!keyword) return true;
  const source = [a.title, a.excerpt, a.content, ...(a.tags || []), ...(a.ageGroups || []), ...(a.practical || [])].join(' ').toLowerCase();
  return source.includes(keyword.toLowerCase());
}

async function initHome(){
  const featured = $('#featuredArticles');
  if(featured){
    const featuredArticles = (await getArticles({mode:'published'})).filter(a => a.featured).slice(0,3);
    featured.innerHTML = featuredArticles.map(articleCard).join('');
    const hero = featuredArticles[0];
    if(hero){
      const heroContainer = $('#heroFeature');
      if(heroContainer){
        heroContainer.innerHTML = `<article class="hero-feature-card">
          <img src="${esc(hero.coverImage)}" alt="${esc(hero.coverAlt || hero.title)}">
          <div class="hero-side-body">
            <div class="hero-side-meta"><span class="chip">${esc(AREA[hero.area]?.name || '')}</span><span class="chip">${esc(CATEGORY[hero.category] || '')}</span></div>
            <h3>${esc(hero.title)}</h3>
            <p>${esc(hero.excerpt)}</p>
            <div class="hero-actions" style="margin:16px 0 0"><a class="btn btn-primary btn-sm" href="article.html?id=${encodeURIComponent(hero.id)}">この記事を見る</a></div>
          </div>
        </article>`;
      }
    }
  }
  const areaWrap = $('#areaGrid');
  if(areaWrap){
    areaWrap.innerHTML = Object.values(AREA).map(a => `<a class="area-card" href="${a.page}"><span class="emoji">${a.emoji}</span><strong>${a.name}</strong><span>${a.desc}</span></a>`).join('');
  }
  const qForm = $('#quickSearchForm');
  if(qForm){
    qForm.addEventListener('submit', e => {
      e.preventDefault();
      const keyword = $('#quickKeyword').value.trim();
      const area = $('#quickArea').value;
      const category = $('#quickCategory').value;
      const params = new URLSearchParams();
      if(keyword) params.set('q', keyword);
      if(area) params.set('area', area);
      if(category) params.set('category', category);
      location.href = `articles.html?${params.toString()}`;
    });
  }
}

async function initArticlesPage(prefArea=''){
  const list = $('#articleList');
  if(!list) return;
  const search = $('#searchInput');
  const area = $('#areaFilter');
  const category = $('#categoryFilter');
  const sort = $('#sortFilter');
  const allPublished = await getArticles({mode:'published'});
  if(prefArea) area.value = prefArea;
  else area.value = qs.get('area') || '';
  category.value = qs.get('category') || '';
  search.value = qs.get('q') || '';
  function render(){
    let items = allPublished
      .filter(a => !area.value || a.area === area.value)
      .filter(a => !category.value || a.category === category.value)
      .filter(a => matchesSearch(a, search.value.trim()));
    if(sort.value === 'old') items = [...items].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    if(sort.value === 'updated') items = [...items].sort((a,b)=>(b.updatedAt||b.date||'').localeCompare(a.updatedAt||a.date||''));
    else items = [...items].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    $('#resultCount').textContent = items.length;
    list.innerHTML = items.map(articleCard).join('');
    $('#emptyState').hidden = !!items.length;
  }
  [search, area, category, sort].forEach(el => el && el.addEventListener('input', render));
  render();
}

async function initAreaPage(){
  const page = document.body.dataset.areaPage;
  if(!page) return;
  const areaData = AREA[page];
  if(!areaData) return;
  document.title = `${areaData.name}の子連れ旅行情報｜九州ファミリー旅ナビ`;
  setMeta('description', `${areaData.name}で子連れ旅行を楽しむためのホテル・観光・グルメ・モデルコース記事をまとめています。`);
  setCanonical(`${location.origin}/${areaData.page}`);
  const heading = $('#areaPageTitle');
  const copy = $('#areaPageCopy');
  if(heading) heading.textContent = `${areaData.name}の子連れ旅行情報`;
  if(copy) copy.textContent = `${areaData.name}エリアのホテル・観光・グルメ・モデルコースを親目線でまとめています。`;
  initArticlesPage(page);
}

async function initArticlePage(){
  const wrap = $('#articleDetail');
  if(!wrap) return;
  const id = qs.get('id');
  const article = (await getArticles({mode:'published', id}))[0];
  if(!article){
    wrap.innerHTML = `<div class="empty-state"><h1>記事が見つかりません</h1><p><a class="btn btn-secondary" href="articles.html">記事一覧へ戻る</a></p></div>`;
    return;
  }
  document.title = `${article.title}｜九州ファミリー旅ナビ`;
  setMeta('description', article.seo?.metaDescription || article.excerpt || '');
  setCanonical(`${location.origin}/article.html?id=${encodeURIComponent(article.id)}`);
  const related = (await getArticles({mode:'published', area:article.area})).filter(a => a.id !== article.id).slice(0,2);
  wrap.innerHTML = `
    <div class="breadcrumbs"><a href="index.html">ホーム</a> / <a href="articles.html">記事一覧</a> / <a href="${AREA[article.area]?.page}">${esc(AREA[article.area]?.name || '')}</a> / <span>${esc(article.title)}</span></div>
    <header class="article-header">
      <div class="meta-row">
        <span class="chip">${esc(AREA[article.area]?.name || article.area)}</span>
        <span class="chip">${esc(CATEGORY[article.category] || article.category)}</span>
        <time>公開日 ${esc(article.date || '')}</time>
      </div>
      <h1>${esc(article.title)}</h1>
      <p class="article-lead">${esc(article.excerpt || '')}</p>
    </header>
    <div class="article-cover">
      <img src="${esc(article.coverImage || '')}" alt="${esc(article.coverAlt || article.title)}">
      <div class="article-cover-badge">${esc(article.icon || '🧳')}</div>
    </div>
    <div class="detail-grid">
      <div>
        <div class="tag-row">${renderTags(article.tags)}</div>
        <div class="article-body">${markdownToHtml(article.content || '')}</div>
        ${related.length ? `<section class="section" style="padding:28px 0 0"><div class="section-head"><div><p class="section-label">RELATED</p><h2>同じエリアのおすすめ</h2></div></div><div class="related-grid">${related.map(articleCard).join('')}</div></section>` : ''}
        <div class="back-link"><a class="btn btn-secondary" href="articles.html">← 記事一覧へ戻る</a></div>
      </div>
      <aside class="sidebar-stack">
        <div class="info-box">
          <h3>子連れチェックポイント</h3>
          <div class="info-list">${(article.practical||[]).map(v=>`<span>${PRACTICAL_ICON[v] || '✔'} ${esc(v)}</span>`).join('')}</div>
        </div>
        <div class="info-box">
          <h3>対象年齢</h3>
          <div class="info-list">${(article.ageGroups||[]).map(v=>`<span>${esc(v)}</span>`).join('')}</div>
        </div>
        <div class="affiliate-box">
          <h3>宿・ツアーをチェック</h3>
          <div class="affiliate-links">
            <a href="${esc(article.affiliate?.rakuten || 'https://travel.rakuten.co.jp/')}" target="_blank" rel="noopener noreferrer">楽天トラベルで見る <span>↗</span></a>
            <a href="${esc(article.affiliate?.jalan || 'https://www.jalan.net/')}" target="_blank" rel="noopener noreferrer">じゃらんで見る <span>↗</span></a>
            <a href="${esc(article.affiliate?.yahoo || 'https://travel.yahoo.co.jp/')}" target="_blank" rel="noopener noreferrer">Yahoo!トラベルで見る <span>↗</span></a>
          </div>
          <p class="inline-help">※ アフィリエイトリンクを設定すると、収益導線として活用できます。</p>
        </div>
        <div class="seo-box">
          <h3>SEOメモ</h3>
          <p class="muted">メタ説明：${esc(article.seo?.metaDescription || article.excerpt || '')}</p>
          <p class="muted">キーワード：${esc(article.seo?.keywords || '')}</p>
        </div>
      </aside>
    </div>`;
}

function serializeForm(form){
  const practical = $$('input[name="practical"]:checked', form).map(el => el.value);
  return {
    id: $('#articleId', form).value || '',
    title: $('#title', form).value.trim(),
    area: $('#area', form).value,
    category: $('#category', form).value,
    icon: $('#icon', form).value.trim() || '🧳',
    coverImage: $('#coverImage', form).value.trim(),
    coverAlt: $('#coverAlt', form).value.trim(),
    excerpt: $('#excerpt', form).value.trim(),
    content: $('#content', form).value.trim(),
    tags: $('#tags', form).value.split(',').map(v=>v.trim()).filter(Boolean),
    ageGroups: $('#ageGroups', form).value.split(',').map(v=>v.trim()).filter(Boolean),
    practical,
    affiliate: {
      rakuten: $('#affiliateRakuten', form).value.trim(),
      jalan: $('#affiliateJalan', form).value.trim(),
      yahoo: $('#affiliateYahoo', form).value.trim()
    },
    seo: {
      metaDescription: $('#metaDescription', form).value.trim(),
      keywords: $('#keywords', form).value.trim()
    },
    featured: $('#featured', form).checked,
    published: $('#published', form).checked
  };
}

function hydrateForm(article){
  const form = $('#articleForm');
  if(!form || !article) return;
  $('#articleId', form).value = article.id || '';
  $('#title', form).value = article.title || '';
  $('#area', form).value = article.area || 'fukuoka';
  $('#category', form).value = article.category || 'spot';
  $('#icon', form).value = article.icon || '🧳';
  $('#coverImage', form).value = article.coverImage || '';
  $('#coverAlt', form).value = article.coverAlt || '';
  $('#excerpt', form).value = article.excerpt || '';
  $('#content', form).value = article.content || '';
  $('#tags', form).value = (article.tags || []).join(', ');
  $('#ageGroups', form).value = (article.ageGroups || []).join(', ');
  $$('input[name="practical"]', form).forEach(el => el.checked = (article.practical || []).includes(el.value));
  $('#affiliateRakuten', form).value = article.affiliate?.rakuten || '';
  $('#affiliateJalan', form).value = article.affiliate?.jalan || '';
  $('#affiliateYahoo', form).value = article.affiliate?.yahoo || '';
  $('#metaDescription', form).value = article.seo?.metaDescription || '';
  $('#keywords', form).value = article.seo?.keywords || '';
  $('#featured', form).checked = !!article.featured;
  $('#published', form).checked = !!article.published;
  $('#editorHeading').textContent = article.id ? '記事を編集' : '新規記事作成';
}
function clearForm(){
  const form = $('#articleForm');
  form.reset();
  $('#articleId', form).value = '';
  $('#icon', form).value = '🧳';
  $('#published', form).checked = true;
  $('#editorHeading').textContent = '新規記事作成';
  $('#saveMessage').textContent = '';
}
function slugify(s){ return (s || '').toLowerCase().normalize('NFKC').replace(/\s+/g,'-').replace(/[^a-z0-9\-ぁ-んァ-ヶ一-龠]/g,'').slice(0,60) || `article-${Date.now()}`; }

async function initAdminPage(){
  if(!document.body.classList.contains('admin-body')) return;
  const loginSection = $('#loginSection');
  const dashboardSection = $('#adminSection');
  const pwdInput = $('#adminPassword');
  const statusEl = $('#adminApiStatus');
  const runtimeEl = $('#runtimeStatus');
  const authEl = $('#authStatus');

  async function updateConnection(){
    const health = await apiHealth();
    const online = health.ok;
    if(statusEl) statusEl.textContent = online ? 'D1 API 接続中' : 'ローカルモード';
    if(runtimeEl) runtimeEl.textContent = online ? 'Cloudflare Pages Functions / D1' : 'ブラウザ LocalStorage';
    if(authEl) authEl.textContent = getAdminPassword() ? 'ログイン済み' : '未ログイン';
  }
  function showAdmin(show){
    loginSection.classList.toggle('hidden', show);
    dashboardSection.classList.toggle('hidden', !show);
  }
  if(getAdminPassword()) showAdmin(true);
  await updateConnection();

  $('#loginButton')?.addEventListener('click', async ()=>{
    setAdminPassword(pwdInput.value.trim());
    showAdmin(true);
    await updateConnection();
    await loadAdmin();
  });
  $('#skipLocalButton')?.addEventListener('click', async ()=>{
    setAdminPassword('');
    showAdmin(true);
    await updateConnection();
    await loadAdmin();
  });
  $('#logoutButton')?.addEventListener('click', async ()=>{
    setAdminPassword('');
    showAdmin(false);
    await updateConnection();
  });

  const tabs = $$('.admin-tab');
  function openTab(name){
    tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));
    $$('.admin-panel').forEach(panel => panel.classList.toggle('active', panel.id === `tab-${name}`));
  }
  tabs.forEach(btn => btn.addEventListener('click', ()=>openTab(btn.dataset.tab)));

  async function getAdminArticles(){ return await getArticles({mode:'all'}); }
  async function saveArticle(data){
    const payload = { ...data, id: data.id || `${slugify(data.title)}-${Date.now().toString().slice(-5)}`, date: data.id ? undefined : new Date().toISOString().slice(0,10), updatedAt: new Date().toISOString().slice(0,10)};
    try{
      if(getAdminPassword()){
        const method = data.id ? 'PUT' : 'POST';
        const saved = await apiMutate(method, payload);
        return saved.article;
      }
      throw new Error('no-api');
    }catch(e){
      const staticItems = await getStaticArticles();
      const locals = getLocalArticles();
      const baseMap = new Map([...staticItems, ...locals].map(a => [a.id, a]));
      const existing = payload.id && baseMap.get(payload.id) ? baseMap.get(payload.id) : {};
      const article = { ...existing, ...payload, date: existing.date || payload.date || new Date().toISOString().slice(0,10) };
      const localMap = new Map(locals.map(a => [a.id, a]));
      localMap.set(article.id, article);
      saveLocalArticles([...localMap.values()]);
      return article;
    }
  }
  async function deleteArticle(id){
    try{
      if(getAdminPassword()){
        await apiMutate('DELETE', {id});
        return;
      }
      throw new Error('no-api');
    }catch(e){
      const next = getLocalArticles().filter(a => a.id !== id);
      saveLocalArticles(next);
    }
  }
  async function seedApi(){
    const staticItems = await getStaticArticles();
    let ok = 0;
    for(const item of staticItems){
      try{ await apiMutate('POST', item); ok += 1; }catch(e){}
    }
    return ok;
  }
  async function renderDashboard(){
    const items = await getAdminArticles();
    $('#statPublished').textContent = items.filter(a=>a.published).length;
    $('#statDraft').textContent = items.filter(a=>!a.published).length;
    $('#statFeatured').textContent = items.filter(a=>a.featured).length;
    $('#statTotal').textContent = items.length;
    $('#recentArticles').innerHTML = items.slice(0,5).map(a => `<div class="admin-list-row"><div class="row-meta"><strong>${esc(a.title)}</strong><small>${esc(AREA[a.area]?.name || a.area)} / ${esc(CATEGORY[a.category] || a.category)} / ${esc(a.updatedAt || a.date || '')}</small></div><span class="status-pill ${a.published ? 'pub' : 'draft'}">${a.published ? '公開' : '下書き'}</span></div>`).join('') || '<p class="muted">記事がありません。</p>';
  }
  async function renderManage(){
    const items = await getAdminArticles();
    $('#manageArticles').innerHTML = items.map(a => `<div class="admin-list-row"><div class="row-meta"><strong>${esc(a.title)}</strong><small>${esc(AREA[a.area]?.name || a.area)} / ${esc(CATEGORY[a.category] || a.category)} / 更新 ${esc(a.updatedAt || a.date || '')}</small><small>タグ：${esc((a.tags || []).join('、') || 'なし')}</small></div><div class="row-actions"><span class="status-pill ${a.published ? 'pub' : 'draft'}">${a.published ? '公開' : '下書き'}</span><button data-edit="${esc(a.id)}">編集</button><button class="btn-danger" data-delete="${esc(a.id)}">削除</button></div></div>`).join('') || '<p class="muted">記事がありません。</p>';
    $$('[data-edit]').forEach(btn => btn.addEventListener('click', async ()=>{
      const item = (await getAdminArticles()).find(a => a.id === btn.dataset.edit);
      hydrateForm(item);
      openTab('editor');
    }));
    $$('[data-delete]').forEach(btn => btn.addEventListener('click', async ()=>{
      if(!confirm('この記事を削除しますか？')) return;
      await deleteArticle(btn.dataset.delete);
      await loadAdmin();
    }));
  }

  async function loadAdmin(){
    await updateConnection();
    await renderDashboard();
    await renderManage();
  }

  $('#articleForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const form = e.currentTarget;
    const input = serializeForm(form);
    const currentId = input.id;
    const article = await saveArticle(input);
    $('#articleId').value = article.id;
    $('#saveMessage').textContent = currentId ? '記事を更新しました。' : '記事を保存しました。';
    await loadAdmin();
  });
  $('#resetForm')?.addEventListener('click', clearForm);
  $('#seedButton')?.addEventListener('click', async ()=>{
    const btn = $('#seedButton');
    btn.disabled = true;
    btn.textContent = '取り込み中…';
    let message = 'ローカルモードのためシードできません。';
    if(getAdminPassword()){
      const count = await seedApi();
      message = `${count} 件の初期記事をD1へ取り込みました。`;
    }
    $('#seedMessage').textContent = message;
    btn.disabled = false;
    btn.textContent = '初期記事をD1へ取り込む';
    await loadAdmin();
  });
  showAdmin(!!getAdminPassword());
  if(getAdminPassword()) await loadAdmin();
}

document.addEventListener('DOMContentLoaded', async ()=>{
  setupMenu();
  if(document.body.dataset.page === 'home') await initHome();
  if(document.body.dataset.page === 'articles') await initArticlesPage();
  if(document.body.dataset.page === 'article') await initArticlePage();
  if(document.body.dataset.page === 'area') await initAreaPage();
  if(document.body.classList.contains('admin-body')) await initAdminPage();
});
