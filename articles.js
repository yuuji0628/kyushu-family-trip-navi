
function json(data, init={}){
  return new Response(JSON.stringify(data), {headers:{'content-type':'application/json; charset=utf-8'}, ...init});
}
function unauthorized(){ return json({error:'Unauthorized'}, {status:401}); }
function normalizeRow(row){
  if(!row) return null;
  return {
    id: row.id,
    title: row.title,
    area: row.area,
    category: row.category,
    icon: row.icon || '🧳',
    coverImage: row.coverImage || '',
    coverAlt: row.coverAlt || '',
    excerpt: row.excerpt || '',
    content: row.content || '',
    tags: row.tags ? JSON.parse(row.tags) : [],
    ageGroups: row.ageGroups ? JSON.parse(row.ageGroups) : [],
    practical: row.practical ? JSON.parse(row.practical) : [],
    affiliate: {
      rakuten: row.affiliateRakuten || '',
      jalan: row.affiliateJalan || '',
      yahoo: row.affiliateYahoo || ''
    },
    seo: {
      metaDescription: row.seoMetaDescription || '',
      keywords: row.seoKeywords || ''
    },
    published: !!row.published,
    featured: !!row.featured,
    date: row.date || '',
    updatedAt: row.updatedAt || ''
  };
}
function requireAuth(request, env){
  const pw = request.headers.get('x-admin-password') || '';
  return env.ADMIN_PASSWORD && pw === env.ADMIN_PASSWORD;
}
function payloadToParams(payload){
  return {
    id: payload.id,
    title: payload.title || '',
    area: payload.area || 'fukuoka',
    category: payload.category || 'spot',
    icon: payload.icon || '🧳',
    coverImage: payload.coverImage || '',
    coverAlt: payload.coverAlt || '',
    excerpt: payload.excerpt || '',
    content: payload.content || '',
    tags: JSON.stringify(payload.tags || []),
    ageGroups: JSON.stringify(payload.ageGroups || []),
    practical: JSON.stringify(payload.practical || []),
    affiliateRakuten: payload.affiliate?.rakuten || '',
    affiliateJalan: payload.affiliate?.jalan || '',
    affiliateYahoo: payload.affiliate?.yahoo || '',
    seoMetaDescription: payload.seo?.metaDescription || '',
    seoKeywords: payload.seo?.keywords || '',
    published: payload.published ? 1 : 0,
    featured: payload.featured ? 1 : 0,
    date: payload.date || new Date().toISOString().slice(0,10),
    updatedAt: payload.updatedAt || new Date().toISOString().slice(0,10)
  };
}

export async function onRequest(context){
  const {request, env} = context;
  const url = new URL(request.url);
  const db = env.DB;
  if(!db) return json({error:'D1 binding DB is not configured'}, {status:500});

  if(request.method === 'GET'){
    if(url.searchParams.get('health')) return json({ok:true, storage:'d1'});
    let sql = 'SELECT * FROM articles';
    const where = [];
    const binds = [];
    if(url.searchParams.get('id')){ where.push('id = ?'); binds.push(url.searchParams.get('id')); }
    if(url.searchParams.get('area')){ where.push('area = ?'); binds.push(url.searchParams.get('area')); }
    if(url.searchParams.get('category')){ where.push('category = ?'); binds.push(url.searchParams.get('category')); }
    if(url.searchParams.get('featured') === '1'){ where.push('featured = 1'); }
    if(url.searchParams.get('published') === '1'){ where.push('published = 1'); }
    if(where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY COALESCE(updatedAt, date) DESC, date DESC';
    const rows = await db.prepare(sql).bind(...binds).all();
    return json({articles:(rows.results || []).map(normalizeRow)});
  }

  if(!requireAuth(request, env)) return unauthorized();
  const payload = payloadToParams(await request.json());

  if(request.method === 'POST'){
    await db.prepare(`INSERT OR REPLACE INTO articles (
      id,title,area,category,icon,coverImage,coverAlt,excerpt,content,tags,ageGroups,practical,
      affiliateRakuten,affiliateJalan,affiliateYahoo,seoMetaDescription,seoKeywords,published,featured,date,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      payload.id,payload.title,payload.area,payload.category,payload.icon,payload.coverImage,payload.coverAlt,
      payload.excerpt,payload.content,payload.tags,payload.ageGroups,payload.practical,payload.affiliateRakuten,
      payload.affiliateJalan,payload.affiliateYahoo,payload.seoMetaDescription,payload.seoKeywords,payload.published,
      payload.featured,payload.date,payload.updatedAt
    ).run();
    const row = await db.prepare('SELECT * FROM articles WHERE id = ?').bind(payload.id).first();
    return json({ok:true, article:normalizeRow(row)});
  }

  if(request.method === 'PUT'){
    await db.prepare(`UPDATE articles SET
      title=?, area=?, category=?, icon=?, coverImage=?, coverAlt=?, excerpt=?, content=?, tags=?, ageGroups=?, practical=?,
      affiliateRakuten=?, affiliateJalan=?, affiliateYahoo=?, seoMetaDescription=?, seoKeywords=?, published=?, featured=?, updatedAt=?
      WHERE id=?`).bind(
      payload.title,payload.area,payload.category,payload.icon,payload.coverImage,payload.coverAlt,payload.excerpt,
      payload.content,payload.tags,payload.ageGroups,payload.practical,payload.affiliateRakuten,payload.affiliateJalan,
      payload.affiliateYahoo,payload.seoMetaDescription,payload.seoKeywords,payload.published,payload.featured,payload.updatedAt,payload.id
    ).run();
    const row = await db.prepare('SELECT * FROM articles WHERE id = ?').bind(payload.id).first();
    return json({ok:true, article:normalizeRow(row)});
  }

  if(request.method === 'DELETE'){
    await db.prepare('DELETE FROM articles WHERE id = ?').bind(payload.id).run();
    return json({ok:true});
  }

  return json({error:'Method not allowed'}, {status:405});
}
