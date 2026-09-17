
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

function todayJst() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());
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
  if (!!env.ADMIN_PASSWORD && password === env.ADMIN_PASSWORD) return true;

  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)admin_session=([^;]+)/);
  if (!match || !env.ADMIN_PASSWORD) return false;

  try {
    return decodeURIComponent(match[1]) === env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}


async function handleAdminLogin(request, env) {
  if (request.method !== "POST") {
    return new Response(null, { status:302, headers:{ location:"/admin.html" } });
  }

  const form = await request.formData().catch(() => new FormData());
  const password = String(form.get("password") || "");

  if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
    return new Response(null, {
      status:303,
      headers:{ location:"/admin.html?login=error" }
    });
  }

  const cookie = [
    "admin_session=" + encodeURIComponent(password),
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Max-Age=43200"
  ].join("; ");

  return new Response(null, {
    status:303,
    headers:{
      location:"/admin.html",
      "set-cookie":cookie,
      "cache-control":"no-store"
    }
  });
}


async function handleAdminAutoCreate(request, env) {
  if (!requireAuth(request, env)) {
    return new Response(null, { status:303, headers:{ location:"/admin.html?auto=unauthorized" } });
  }
  if (request.method !== "POST") {
    return new Response(null, { status:303, headers:{ location:"/admin.html" } });
  }

  try {
    const result = await autoCreateKyushuHotelArticle(env);
    const q = new URLSearchParams();

    if (result?.skipped) {
      q.set("auto", "skip");
      q.set("msg", String(result?.reason || "今回は候補がありませんでした").slice(0,180));
    } else {
      q.set("auto", "success");
      q.set("msg", String(result?.hotelName || "記事を作成しました").slice(0,180));
      if (result?.url) q.set("article", String(result.url));
    }

    return new Response(null, {
      status:303,
      headers:{ location:"/admin.html?" + q.toString(), "cache-control":"no-store" }
    });
  } catch (e) {
    const q = new URLSearchParams();
    q.set("auto", "error");
    q.set("msg", String(e?.message || e).slice(0,180));
    return new Response(null, {
      status:303,
      headers:{ location:"/admin.html?" + q.toString(), "cache-control":"no-store" }
    });
  }
}


async function handleAdminDeleteArticle(request, env) {
  if (!requireAuth(request, env)) {
    return new Response(null, { status:303, headers:{ location:"/admin.html?delete=unauthorized" } });
  }
  if (request.method !== "POST") {
    return new Response(null, { status:303, headers:{ location:"/admin.html" } });
  }
  if (!env.DB) {
    return new Response(null, { status:303, headers:{ location:"/admin.html?delete=error&msg=D1%20binding%20missing" } });
  }

  try {
    const form = await request.formData();
    const id = String(form.get("id") || "").trim();
    if (!id) {
      return new Response(null, { status:303, headers:{ location:"/admin.html?delete=error&msg=id%20missing" } });
    }

    const row = await env.DB.prepare("SELECT id, title FROM articles WHERE id = ? LIMIT 1").bind(id).first();
    if (!row) {
      return new Response(null, { status:303, headers:{ location:"/admin.html?delete=notfound" } });
    }

    await env.DB.prepare("DELETE FROM articles WHERE id = ?").bind(id).run();

    const q = new URLSearchParams();
    q.set("delete", "success");
    q.set("msg", String(row.title || id).slice(0,180));
    return new Response(null, {
      status:303,
      headers:{ location:"/admin.html?" + q.toString(), "cache-control":"no-store" }
    });
  } catch (e) {
    const q = new URLSearchParams();
    q.set("delete", "error");
    q.set("msg", String(e?.message || e).slice(0,180));
    return new Response(null, {
      status:303,
      headers:{ location:"/admin.html?" + q.toString(), "cache-control":"no-store" }
    });
  }
}


async function handleAdminHotelArticleCreate(request, env) {
  if (!requireAuth(request, env)) {
    return new Response(null, { status:303, headers:{ location:"/admin.html?hotelCreate=unauthorized" } });
  }
  if (request.method !== "POST") {
    return new Response(null, { status:303, headers:{ location:"/admin.html" } });
  }

  try {
    const form = await request.formData();
    const hotelJson = String(form.get("hotelJson") || "");
    const rakutenUrl = String(form.get("rakutenUrl") || "").trim();
    const hotel = hotelJson ? JSON.parse(hotelJson) : {};

    const headers = new Headers(request.headers);
    headers.set("content-type", "application/json");

    const apiRequest = new Request(new URL("/api/hotel-article", request.url), {
      method:"POST",
      headers,
      body:JSON.stringify({ hotel, rakutenUrl })
    });

    const apiResponse = await createGenericHotelArticle(apiRequest, env);
    const data = await apiResponse.json().catch(() => ({}));

    const q = new URLSearchParams();
    if (apiResponse.ok) {
      q.set("hotelCreate", "success");
      q.set("msg", String(data.title || hotel.hotelName || "記事を作成しました").slice(0,180));
      if (data.url) q.set("article", String(data.url));
    } else {
      q.set("hotelCreate", "error");
      q.set("msg", String(data.error || ("HTTP " + apiResponse.status)).slice(0,180));
    }
    return new Response(null, {
      status:303,
      headers:{ location:"/admin.html?" + q.toString(), "cache-control":"no-store" }
    });
  } catch (e) {
    const q = new URLSearchParams();
    q.set("hotelCreate", "error");
    q.set("msg", String(e?.message || e).slice(0,180));
    return new Response(null, {
      status:303,
      headers:{ location:"/admin.html?" + q.toString(), "cache-control":"no-store" }
    });
  }
}

function handleAdminLogout() {
  return new Response(null, {
    status:303,
    headers:{
      location:"/admin.html",
      "set-cookie":"admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
      "cache-control":"no-store"
    }
  });
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

const SUGINOI_ARTICLE = {"id": "suginoi-hotel-family-guide", "title": "杉乃井ホテルは子連れにおすすめ？プール・棚湯・食事・赤ちゃん連れまで家族旅行目線で徹底解説", "area": "oita", "category": "hotel", "icon": "🏨", "excerpt": "別府温泉 杉乃井ホテルを子連れで楽しむための完全ガイド。棚湯、アクアガーデン、アクアビート、離乳食、客室選び、1泊2日の過ごし方まで家族旅行目線で詳しく紹介します。", "content": "## 杉乃井ホテルは「泊まる場所」より「旅行の目的地」に近いホテル\n\n別府の家族旅行で杉乃井ホテルを候補に入れるなら、考え方を少し変えると旅程が組みやすくなります。観光を一日中詰め込んで、夜にホテルへ戻って寝るだけにするよりも、「ホテルそのものを楽しむ時間」をしっかり確保するのがおすすめです。\n\n杉乃井ホテルには、大展望露天風呂「棚湯」、水着で楽しむ屋外型温泉「アクアガーデン」、季節営業の屋内プール「アクアビート」など、子どもと一緒に楽しめる施設があります。さらに食事や館内のエンターテインメントもあり、ホテルに着いてからも家族の予定が続いていく感覚があります。\n\n子ども連れの旅行では、移動が増えるほど荷物も増え、予定どおりに進まない場面も増えます。だからこそ、一つの場所で「遊ぶ・食べる・温泉に入る・寝る」が完結しやすいことは大きな魅力です。\n\nこの記事では、杉乃井ホテルを子連れで選ぶときに知っておきたいポイントを、赤ちゃん連れから小学生まで家族目線で詳しくまとめます。\n\n## まず知っておきたい杉乃井ホテルの基本情報\n\n杉乃井ホテルは大分県別府市観海寺にある大型リゾートホテルです。JR別府駅からはホテルとの間を結ぶ無料シャトルバスがあり、車の場合は別府ICからもアクセスしやすい立地です。駐車場も用意されているため、九州内からの家族旅行では車でも電車でも計画を立てやすい宿です。\n\nチェックインは基本15時、チェックアウトは11時。宿泊プランによって条件が異なる場合があるため、予約時には必ずプラン詳細を確認してください。\n\n家族旅行で特にうれしいのは、チェックイン前やチェックアウト後にも、条件を満たせば棚湯などの施設を利用できる点です。到着日の午前中に別府へ着いた場合でも、「15時まで何をしよう」と時間を持て余しにくくなります。\n\n## 子どもが喜びやすい理由1｜大展望露天風呂「棚湯」\n\n杉乃井ホテルを代表する施設の一つが、大展望露天風呂「棚湯」です。\n\n別府湾や別府の街を見渡すような開放感があり、「温泉に入る」というよりも、景色そのものを体験する時間に近い印象です。大人にとっては旅の疲れをほどく場所ですが、子どもにとっても、いつもの家のお風呂とはまったく違う景色が旅の記憶に残りやすいでしょう。\n\n小さな子どもと入る場合は、長湯をさせないことが大切です。親が景色をゆっくり楽しみたくても、子どもは熱さや疲れをうまく言葉にできないことがあります。短めの入浴と水分補給を意識し、無理をしないのが家族全員で楽しむコツです。\n\nまた、宿泊者はチェックイン前やチェックアウト後にも利用できる案内があります。旅程に余裕を持たせたい家族には、この「宿泊時間の前後も楽しめる」という点がかなり便利です。\n\n## 子どもが喜びやすい理由2｜水着で楽しめるアクアガーデン\n\n温泉は子どもが飽きてしまいそう、という家庭でも楽しみやすいのが「アクアガーデン」です。\n\nここは水着で入る屋外型の温泉施設で、家族一緒に楽しめるのが大きなポイントです。男女で分かれる通常の温泉だと、家族旅行なのに途中から別行動になることがありますが、水着で利用するアクアガーデンなら家族で同じ時間を過ごしやすくなります。\n\n公式案内では、噴水ショーなども行われています。昼と夜では雰囲気が変わるため、時間が合えば夜に利用するのも魅力的です。\n\nオムツが取れていない子どもについては、水遊び用パンツの着用が案内されています。また、持ち込める浮き輪や遊泳器具にも条件があります。子ども用の浮き輪を持参する場合は、旅行前にサイズや種類を公式情報で確認しておくと安心です。\n\nレンタル水着の案内もありますが、子どもはサイズや着心地の好みがあるので、可能なら普段使い慣れた水着を持って行くほうがスムーズです。\n\n## 子どもが喜びやすい理由3｜アクアビートは「ホテルのプール」のイメージを超える\n\nプール好きの子どもがいるなら、季節営業の「アクアビート」は要チェックです。\n\nアクアビートにはボディスライダーやリバーランスライダー、子ども向けの浅いキッズプールなどがあり、遊ぶことを目的にホテルを選びたい家庭と相性が良い施設です。\n\n2026年は営業期間が11月1日まで延長されていますが、営業期間は年ごとに変わる可能性があります。予約時には「泊まる日に営業しているか」を必ず確認してください。\n\nここで大切なのは、ホテル到着後の予定を詰め込みすぎないことです。子どもがプールを気に入ると、「あと一回」「もう一回」となりやすく、予定より長く遊ぶことがあります。夕食時間を早く固定しすぎるより、プールから上がって着替える時間まで見込んで余裕を持たせるほうが安心です。\n\n## 赤ちゃん連れでも検討しやすい｜離乳食への対応\n\n赤ちゃんとの旅行でホテル選びを難しくするのが食事です。\n\n杉乃井ホテルでは、公式FAQで市販の離乳食を月齢別に用意している案内があります。5か月、7か月、9か月、12か月向けが案内されており、必要な場合はレストランスタッフへ相談できます。\n\nまた、持参した離乳食を電子レンジで温めてもらうことも可能と案内されています。\n\nもちろん、普段食べ慣れているものを持参したい家庭も多いと思います。旅先で初めての食材を試すより、「いつもの食事」を確保できるだけで親の安心感はかなり違います。\n\nミルク、離乳食、スプーン、エプロン、飲み物など、食事関係だけは一つのバッグにまとめておくと移動が楽です。ホテルに到着したらすぐ使うものを、スーツケースの奥に入れないようにしておくのもポイントです。\n\n## 食事はビュッフェが家族旅行と相性がいい\n\n杉乃井ホテルでは宿泊プランによって食事会場が異なりますが、ビュッフェ形式のプランが多く見られます。\n\n子連れ旅行でビュッフェが便利なのは、「家族全員が同じ料理を食べなくてもいい」ことです。\n\n大人はせっかくの旅行だから好きな料理を楽しみたい。一方で子どもは、旅行先でも普段食べているものを選びたがることがあります。そんなとき、選択肢が多い食事形式は助かります。\n\n小さい子どもがいる場合は、夕食を遅くしすぎないのがおすすめです。昼寝をしていない日は17時台から眠くなることもあり、食事中に機嫌が崩れてしまうケースがあります。\n\n「旅行だから夜まで頑張る」より、早めに食事をして、その後に温泉や館内散策を楽しむほうが結果的に家族全員がラクなこともあります。\n\n## 星館・宙館など、どの客室を選ぶかは「何を優先するか」で決める\n\n杉乃井ホテルは規模が大きく、複数の宿泊棟があります。\n\n新しさや景色、食事会場への動線、利用したい温泉など、何を優先するかによって選び方が変わります。特に乳幼児連れの場合は、「一番豪華な部屋」より「移動が少ない部屋」のほうが快適なこともあります。\n\nベビーカーでの移動、食事会場までの距離、子どもが寝たあとに部屋でどう過ごすか。このあたりを考えて客室タイプを選ぶと失敗しにくくなります。\n\n小学生以上なら、本人に写真を見せながら「どの部屋がいい？」と選ばせるのもおすすめです。旅行前から子どもが参加することで、旅そのものへの期待感が高まります。\n\n## 私ならこう組む｜子連れ杉乃井ホテル1泊2日モデルプラン\n\n### 1日目\n\n10:30〜11:00ごろに別府到着。\n\nまずは早めの昼食を済ませます。午後に観光を入れる場合も、一か所程度に絞ります。地獄めぐりなどに行くなら、全部回ろうとせず家族の体力に合わせます。\n\n14:00ごろホテルへ向かい、到着手続きを済ませます。\n\n15:00前後から部屋へ。荷物を置いたら、水着に着替えてアクアガーデンやアクアビートへ。\n\n17:30〜18:30ごろに夕食。\n\n食後は子どもの体力が残っていれば棚湯へ。小さい子どもなら、夕食後すぐに無理をして温泉へ行かず、部屋で少し休憩するのもありです。\n\n夜は家族で写真を見返したり、翌日の予定を話したりして早めに就寝します。\n\n### 2日目\n\n朝は少し早めに起きて、朝風呂を楽しむのも杉乃井ホテルらしい過ごし方です。\n\n朝食後は部屋に戻って荷物整理。\n\n11:00にチェックアウトしたあと、条件を確認して棚湯などをもう一度楽しむのも良いでしょう。その後は別府市内で昼食をとり、午後に一か所だけ観光して帰宅すると、子どもへの負担を抑えやすくなります。\n\n## 年齢別｜杉乃井ホテルでの楽しみ方\n\n### 0〜2歳\n\nこの年齢は「たくさん遊ばせる」より、生活リズムを崩しすぎないことが最優先です。\n\n昼寝、ミルク、離乳食、入浴時間を大きく変えすぎないようにします。アクアガーデンを利用する場合は、水遊び用パンツなどの条件を事前確認しておきましょう。\n\nホテル内で過ごせる時間が多いため、観光地を何か所も移動する旅行より、親の負担を抑えやすいのは大きなメリットです。\n\n### 3〜6歳\n\n「自分で遊べること」が増えてくる年齢です。\n\nプールやアクアガーデンを中心に予定を組むと満足度が高くなりやすいです。ただし、楽しくて休憩を忘れがちなので、水分補給と休憩時間を意識してください。\n\n夕食前に遊びすぎると寝てしまうこともあるため、夕方は少し余裕を残します。\n\n### 小学生\n\n杉乃井ホテルを一番満喫しやすい年代の一つです。\n\nスライダー、プール、温泉、ビュッフェなど、自分で選んで楽しめるものが増えます。旅行前に「何を一番やりたい？」と聞いて、子どもの希望を一つ旅程に入れておくと満足感が高まります。\n\n## 予約前に確認したい5つのポイント\n\n- アクアビートの営業期間\n- 利用したい温泉・プールの営業時間\n- 宿泊棟と食事会場\n- 子どもの宿泊料金・食事条件\n- キャンセル条件\n\n特にプール目的の場合は、施設の営業日確認が重要です。ホテルを予約してから「その日はプールが営業していなかった」とならないよう、予約前に公式情報を確認しましょう。\n\nまた、宿泊料金は曜日、人数、客室、食事内容によって変動します。家族旅行では大人料金だけでなく、子どもの料金区分も含めて総額を見るのが大切です。\n\n## 楽天トラベルで予約するときの見方\n\n楽天トラベルで杉乃井ホテルを探す場合は、料金だけを見るより、まず「宿泊棟」「食事会場」「部屋タイプ」「子どもの条件」を確認してください。\n\n同じ日でもプランによって内容が異なるため、最安値だけで決めると、希望していた食事会場や客室ではなかったということがあります。\n\n子連れ旅行の場合は、次の順番で比較すると分かりやすいです。\n\n1. 宿泊日と人数を正しく入力\n2. 子どもの年齢区分を確認\n3. 食事付きか確認\n4. 宿泊棟と客室を確認\n5. キャンセル条件を確認\n6. 最後に総額を比較\n\nこの記事内の「楽天トラベルで確認」ボタンから、現在の宿泊プランや料金を確認できます。\n\n## 杉乃井ホテルはこんな家族におすすめ\n\n- ホテルの中でも子どもを遊ばせたい\n- プールや温泉を家族旅行のメインにしたい\n- 観光地を何か所も移動したくない\n- 赤ちゃん連れで食事面が心配\n- 小学生が楽しめるホテルを探している\n- 別府で「ホテル自体が思い出になる宿」を選びたい\n\n逆に、朝から夜まで別府市内を観光し、ホテルには寝るためだけに戻る予定なら、杉乃井ホテルの魅力を使い切れない可能性があります。\n\nせっかく泊まるなら、到着日は早めにホテルへ入り、施設を楽しむ時間を取るのがおすすめです。\n\n## まとめ｜子連れなら「観光を減らしてホテル時間を増やす」が正解になりやすい\n\n杉乃井ホテルの魅力は、温泉だけではありません。\n\n棚湯で景色を楽しみ、アクアガーデンで家族一緒に過ごし、営業期間が合えばアクアビートで思いきり遊ぶ。夕食では家族それぞれが好きなものを選び、部屋へ戻ったら今日撮った写真を見返す。\n\nこうした一つ一つの時間が、そのまま家族旅行の思い出になります。\n\n子ども連れでは、予定どおりに進まないことも旅の一部です。だからこそ、観光地を詰め込みすぎず、「今日はホテルでゆっくり楽しめれば十分」と考えておくと、親にも子どもにも余裕が生まれます。\n\n杉乃井ホテルへ泊まるなら、単なる宿泊先ではなく「1泊2日の目的地」として計画してみてください。\n\n※施設の営業時間、営業期間、料金、子どもの利用条件などは変更される場合があります。2026年9月時点の公開情報をもとに構成しています。予約・旅行前には必ず杉乃井ホテル公式サイトおよび予約ページで最新情報をご確認ください。", "tags": ["別府", "杉乃井ホテル", "子連れホテル", "家族旅行", "温泉", "プール"], "ageGroups": ["0-2歳", "3-6歳", "7歳以上"], "practical": ["アクアビートは営業期間を事前確認", "水着は持参がおすすめ", "乳幼児は生活リズム優先", "宿泊棟と食事会場を予約時に確認"], "seoMetaDescription": "別府温泉 杉乃井ホテルは子連れにおすすめ？棚湯、アクアガーデン、アクアビート、離乳食、食事、客室、アクセス、1泊2日のモデルプランまで家族旅行目線で詳しく解説。", "seoKeywords": "杉乃井ホテル 子連れ,杉乃井ホテル プール,杉乃井ホテル 赤ちゃん,杉乃井ホテル アクアガーデン,別府 子連れ ホテル,大分 家族旅行"};

const PREMIUM_ARTICLES = [{"id": "beppu-family-hotel", "title": "別府で子連れにおすすめのホテル5選｜温泉もプールも、家族みんなが笑顔になれる宿選び", "excerpt": "別府の子連れ旅は、観光地を詰め込むより「宿そのものを楽しめるか」で満足度が変わります。5つの宿候補と、赤ちゃん・幼児・小学生それぞれの目線で失敗しない選び方を紹介します。", "tags": ["別府", "子連れホテル", "温泉", "家族旅行", "プール"], "ageGroups": ["0-2歳", "3-6歳", "7歳以上"], "practical": ["宿泊前に子ども向け設備を再確認", "夕食は早めの時間帯がおすすめ", "温泉は子どもの体調優先", "館内移動が少ない宿は乳幼児連れに便利"], "seo": {"metaDescription": "別府で子連れ旅行におすすめしたいホテル5軒を、温泉・プール・館内設備・食事・移動のしやすさなど家族目線で紹介。赤ちゃん連れから小学生まで、宿選びで後悔しないポイントも解説します。", "keywords": "別府 子連れ ホテル,別府 家族旅行,別府 温泉 子供,杉乃井ホテル 子連れ,大分 子連れホテル"}, "content": "## 別府の子連れ旅は「ホテルで何時間過ごすか」を考えると失敗しにくい\n別府は地獄めぐりや温泉街散策など見どころが多い一方、子ども連れでは移動だけで想像以上に体力を使います。だから私なら、観光地を1つ増やすよりも「早めにホテルへ戻って、館内で遊べる余白」を残します。\n\n大人だけの旅行なら宿は寝る場所でも構いません。でも子連れ旅行では、ホテルのプール、温泉、食事、部屋の広さ、ベッドまわり、館内移動のしやすさまで全部が旅の一部です。子どもがホテルに着いた瞬間に「まだ遊べる！」と目を輝かせる。その時間こそ、家族旅行であとから思い出す場面になると思います。\n\n## 1. 別府温泉 杉乃井ホテル｜ホテル滞在そのものをイベントにしたい家族へ\n別府のファミリー旅でまず候補に入れたいのが杉乃井ホテルです。温泉だけでなく、季節営業の屋内型プール「アクアビート」や、水着で楽しめるアクアガーデンなど、ホテルの中で過ごす選択肢が多いのが強みです。\n\n特に子どもが小学生くらいになると、「温泉に入った」より「スライダーで何回も遊んだ」「夜の景色を見ながら水着で遊んだ」という記憶のほうが強く残ることがあります。私ならチェックイン日は観光を欲張らず、午後からホテル時間をたっぷり取ります。\n\n- 向いている家族：館内で1日遊びたい、プール好き、兄弟で年齢差がある\n- 気をつけたい点：施設ごとに営業期間・時間が異なるため宿泊前に公式情報を確認\n- 旅のコツ：水着や子どもの着替えをすぐ出せるバッグに分けておく\n\n## 2. 亀の井ホテル 別府｜駅周辺も楽しみながら動きたい家族へ\n別府駅周辺を拠点に観光したいなら、移動のしやすさは大きな価値になります。乳幼児連れでは「目的地まであと20分」が思った以上に長く感じることがあります。宿へ戻りやすい立地は、それだけで安心材料です。\n\n私なら昼間は地獄めぐりなどを楽しみ、夕方は無理をせずホテルへ。子どもが眠くなる前に食事とお風呂を済ませ、夜は部屋でゆっくりします。旅行中に予定を削る勇気も、子連れ旅では大切です。\n\n## 3. AMANEK 別府ゆらり｜街歩きもホテル時間も楽しみたい家族へ\n別府の街を歩きながら、少しスタイリッシュな滞在も楽しみたい家族に合う候補です。親にとっても「子どものためだけの旅行」ではなく、自分たちが気分よく過ごせる宿を選ぶことは大切だと思います。\n\n子どもが寝たあとに、今日撮った写真を夫婦で見返す。そんな静かな時間まで含めて旅行です。設備や子ども向けサービスは宿泊プラン・客室によって確認し、家族構成に合う部屋を選びましょう。\n\n## 4. ホテル白菊｜温泉と食事をゆっくり味わいたい家族へ\n別府らしい「温泉旅」の雰囲気を大切にしたいなら、落ち着いて過ごせる温泉宿も魅力です。子どもがまだ小さい時期は、観光を何カ所も回るより、宿で食事をして、お風呂に入り、早めに寝るだけでも十分に特別な一日になります。\n\n温泉デビューの場合は長湯をしないこと、熱さを必ず確認すること、入浴後に水分を取ることを優先したいところです。\n\n## 5. グランヴィリオホテル別府湾 和蔵｜車旅で海辺の開放感も楽しみたい家族へ\n別府湾沿いを車で移動する家族なら、海が近い宿は旅の気分をぐっと高めてくれます。ホテルの窓からいつもと違う景色が見えるだけで、子どもは意外なほど喜びます。\n\n私なら翌朝は少し早起きして、家族で朝の海を眺めます。特別なアクティビティがなくても、「みんなで同じ景色を見る」時間が旅の記憶になります。\n\n## 年齢別に見る、ホテル選びの優先順位\n### 0〜2歳\n- ベッド配置と転落対策を確認\n- おむつ替え・ミルク・離乳食の動線を短く\n- 部屋のお風呂が使いやすいかも確認\n- 昼寝時間を崩しすぎない\n\n### 3〜6歳\n- キッズスペースやプールなど「自分で遊べる場所」があると満足度が上がる\n- 夕食開始を遅くしすぎない\n- 温泉は短時間を複数回に分けるのもおすすめ\n\n### 小学生\n- プールや体験施設など、本人が「やりたい」と思えるものを1つ選ばせる\n- 旅程づくりに参加させると、旅行前から楽しめる\n\n## 私ならこう回る｜1泊2日のゆるい別府プラン\n### 1日目\n- 10:30ごろ 別府到着\n- 11:00 早めの昼食\n- 12:30 観光スポットを1〜2カ所\n- 15:00 ホテルへ\n- 15:30 館内施設や温泉\n- 17:30〜18:00 夕食\n- 20:00 部屋でゆっくり\n\n### 2日目\n朝食後は子どもの機嫌を見て出発。前日に遊び切ったなら、午前中はお土産や軽い観光だけでも十分です。\n\n## 子連れ別府旅でいちばん大切にしたいこと\n「せっかく来たから全部行こう」と思うほど、旅行は忙しくなります。でも、子どもが一番楽しそうだったのがホテルのプールだったり、売店で選んだお菓子だったりするのが家族旅行です。\n\n予定通りに回ることより、家族全員が笑って帰れること。その余白を作ってくれるホテルを選べば、別府旅行はきっともっと好きになります。\n\n※施設・サービス・営業内容は変更される場合があります。予約前に各ホテルの公式情報をご確認ください。"}, {"id": "aso-family-drive", "title": "阿蘇を子どもと楽しむ1日モデルコース｜動物・草千里・ご当地グルメを無理なく満喫", "excerpt": "阿蘇は景色が壮大だからこそ、子連れでは移動を詰め込みすぎないのが正解。動物とのふれあい、草千里、ミルクスイーツまで、家族が疲れにくい1日の回り方を紹介します。", "tags": ["阿蘇", "子連れ", "モデルコース", "草千里", "動物"], "ageGroups": ["3-6歳", "7歳以上"], "practical": ["火山規制・道路情報は当日確認", "山上は平地より気温差が出やすい", "車酔い対策を用意", "休憩時間を長めに確保"], "seo": {"metaDescription": "阿蘇を子どもと楽しむ1日モデルコース。阿蘇カドリー・ドミニオン、草千里、阿蘇のミルクスイーツなどを、家族が疲れにくい順番で紹介します。", "keywords": "阿蘇 子連れ,阿蘇 モデルコース,草千里 子供,熊本 家族旅行,阿蘇 観光 子供"}, "content": "## 阿蘇は「全部見よう」としないほうが、むしろ好きになる\n阿蘇へ向かう道で景色が少しずつ開けてくると、「熊本にこんな場所があるんだ」と何度見ても気持ちが高まります。けれど子連れ旅では、景色の壮大さに反して、車移動や気温差で子どもが疲れやすいのも阿蘇です。\n\nもし私が子どもを連れて1日回るなら、目的は3つだけにします。「動物」「草原」「おいしいもの」。それ以上は、元気が残っていたら追加するくらいがちょうどいいです。\n\n## 9:30 阿蘇カドリー・ドミニオンからスタート\n朝は動物とのふれあいから始めます。子どもは到着直後が一番元気。最初に「見るだけ」ではなく、身体を使って楽しめる場所を入れると、その日のテンションが上がります。\n\n園内には食事施設もあるため、予定が少しずれても立て直しやすいのが子連れには助かります。営業時間やショー内容は季節・天候で変わることがあるので、当日の公式情報を確認しておきましょう。\n\n私なら「全部のショーを見る」より、子どもが気に入った動物の前で少し長く過ごします。旅行では、予定表より子どもの「もう一回見たい」を優先したほうが、結果的に良い思い出になりやすいです。\n\n## 11:30 少し早めのランチ\n阿蘇の昼食は、混雑ピークより少し前を狙います。あか牛丼や郷土料理は大人にとって旅の楽しみですが、子どもが食べ慣れていない場合は、うどん・カレー・取り分けできる料理の有無も確認しておくと安心です。\n\n「有名店に絶対行く」と決めすぎないことも大切。空腹の子どもと行列に並ぶ時間は、想像以上に長く感じます。\n\n## 13:00 草千里へ｜阿蘇らしさを家族で感じる時間\n草千里周辺に着くと、視界いっぱいに草原が広がります。写真では伝わりにくいのですが、阿蘇の魅力は「広さ」そのものです。\n\n子どもが走りたくなる気持ちも分かります。ただし山上は天候が変わりやすく、風が強い日や気温が低い日もあります。夏でも薄手の羽織りを1枚、秋以降は防寒を意識しておくと安心です。\n\n火山周辺は規制状況が変化します。中岳火口を旅程の必須条件にせず、草千里を中心に組むと予定変更にも強いコースになります。\n\n## 14:30 「何もしない時間」を30分入れる\n子連れ旅で意外と重要なのが、予定のない30分です。\n\n車の中で昼寝してもいい。売店でお土産を選んでもいい。ベンチでぼーっと景色を見てもいい。この余白があるだけで、親も「急いで！」と言う回数が減ります。\n\n阿蘇の景色を前にすると、何かを体験し続けなくても旅行は成立するのだと感じます。風の音や草の匂いまで含めて、阿蘇です。\n\n## 15:30 ASO MILK FACTORY周辺で甘い休憩\n帰路に入る前に、阿蘇のミルクを使ったスイーツで休憩。子どもにとって「最後にアイスを食べた」という記憶は強いものです。\n\n親もここでひと息。運転前に座って休める時間をつくると、帰り道の負担が変わります。\n\n## 17:00ごろ 阿蘇を出発\n夕方は道路が混みやすい日もあるため、夕食を阿蘇で取るか、帰宅方面で取るかを子どもの体力で決めます。元気ならもう一カ所、疲れていたら迷わず帰る。それで十分です。\n\n## 子連れ阿蘇ドライブの持ち物\n- 酔い止めやエチケット袋\n- 羽織れる上着\n- 飲み物\n- 歩きやすい靴\n- 帽子・日焼け対策\n- 車内で食べられる軽いおやつ\n- 着替え1セット\n\n## 阿蘇で私が大切にしたいこと\n阿蘇は「何カ所行ったか」を競う場所ではありません。\n\n草原を見て、子どもが「広いね」と言う。動物を見て笑う。帰りの車で眠ってしまう。そんな何気ない場面がつながって、一日が完成します。\n\n家族旅行の成功は、予定を全部消化することではなく、「また来たいね」と言って帰れること。阿蘇は、その言葉が自然に出てくる場所だと思います。\n\n※火山活動・道路・施設営業の状況は変わることがあります。出発前と当日に最新の公式情報をご確認ください。"}, {"id": "fukuoka-rainy-day", "title": "雨の日でも大丈夫！福岡の子連れ室内スポット7選｜年齢別に選べる1日プラン", "excerpt": "旅行の日が雨でも、福岡なら予定を全部あきらめる必要はありません。赤ちゃん連れから小学生まで楽しみやすい室内スポット7カ所と、雨の日を笑顔で終えるコツを紹介します。", "tags": ["福岡", "雨の日", "子連れ", "室内スポット", "家族旅行"], "ageGroups": ["0-2歳", "3-6歳", "7歳以上"], "practical": ["屋内でも移動時の雨対策は必要", "人気施設は事前予約を確認", "着替えとタオルを1組用意", "午後は予定を詰めすぎない"], "seo": {"metaDescription": "福岡で雨の日に子どもと楽しめる室内スポット7選。アンパンマンミュージアム、福岡市科学館、teamLab Forest、マリンワールドなど、年齢別の選び方も紹介。", "keywords": "福岡 雨の日 子連れ,福岡 室内 子供,福岡 子連れ 観光,福岡 雨 観光 家族,福岡 子供 遊び場"}, "content": "## 旅行の日が雨。でも、福岡なら「ハズレの日」にしなくていい\n朝、ホテルのカーテンを開けて雨が降っていると、親のほうが先に落ち込みます。「今日どうしよう」と。\n\nでも福岡は、雨の日に強い街です。地下鉄で移動しやすく、室内で半日過ごせる施設も多い。私なら「晴れの予定を無理に再現する」のではなく、その日しかできない室内プランに切り替えます。\n\n子どもは意外と天気を気にしていません。親が楽しそうに「今日はこっちに行こう！」と言えば、それが今日の正解になります。\n\n## 1. 福岡アンパンマンこどもミュージアムinモール｜未就学児なら最有力\nアンパンマンが好きな年齢なら、雨の日の安心感はかなり高いです。全天候型の屋内施設で、天気を気にせず遊べます。\n\n特に2〜5歳くらいは「知っているキャラクターに会えた」というだけで旅行の満足度が上がります。親にとっては、雨の中で次の場所へ移動せずに長く過ごせることがありがたいポイントです。\n\n- おすすめ年齢：1〜6歳前後\n- こんな日に：強い雨、未就学児中心\n- コツ：午前は混みやすい日があるため、時間帯も検討\n\n## 2. 福岡市科学館｜幼児から小学生まで、親も一緒に楽しみやすい\n六本松にある福岡市科学館は、「遊び」と「学び」の間にある施設です。子どもが触って試して、なぜだろうと考える。親も横で一緒に面白がれるのが良いところ。\n\n貸出用ベビーカーがあり、授乳室やおむつ交換設備も案内されています。兄弟で年齢差がある家族にも組み込みやすい施設です。\n\n私なら、全部を理解させようとはしません。「これ面白いね」と一緒に笑うだけで十分。旅行先での学びは、そのくらい軽いほうが記憶に残ります。\n\n## 3. teamLab Forest 福岡｜身体を動かしたい小学生に\nデジタルアートの中を歩き、探し、身体を動かす体験は、普通の美術館とはかなり違います。\n\n雨で外遊びができない日に、身体を使える室内施設は貴重です。暗い空間や立体的な動きがあるため、小さい子は怖がらないか、年齢に合うかを事前に確認しておくと安心です。\n\n- おすすめ：幼児後半〜小学生\n- ポイント：写真を撮るだけでなく、一緒に体験する\n\n## 4. マリンワールド海の中道｜雨の日でも「旅行に来た感」がある\n水族館は雨の日の王道ですが、家族旅行では強い味方です。大きな水槽の前で子どもが急に静かになり、魚を目で追う時間。テーマパークとは違う、ゆったりした楽しさがあります。\n\n館内中心で過ごせますが、ショーなど一部は天候や時期の影響を受けることがあります。最新の営業案内を確認してから向かいましょう。\n\n## 5. 福岡市博物館｜少し落ち着いた時間を作りたい日に\nずっと「遊ぶ施設」ばかりだと、親も子も疲れます。小学生くらいなら、博物館を間に挟むと一日のリズムが変わります。\n\nすべての展示を丁寧に見る必要はありません。興味を持ったものを1つ見つけたら、それで十分です。\n\n## 6. 九州国立博物館｜太宰府と組み合わせる雨の日プラン\n太宰府方面へ行く予定だったなら、雨だから完全に中止するのではなく、屋内施設を中心に組み替える方法があります。\n\n展示を楽しんだあと、雨が弱まれば周辺を少し歩く。強ければ無理をしない。旅程を「固定」ではなく「可変」にしておくと、家族旅行はずっとラクになります。\n\n## 7. キャナルシティ博多｜食事・休憩・買い物をまとめたいとき\n子連れの雨の日は、「遊ぶ場所」以上に「食べる・トイレ・休む・買う」が一カ所で済むことが重要です。\n\n午前中に科学館やミュージアムで遊び、午後はキャナルシティ周辺で食事と買い物。そんな組み方なら移動回数を減らせます。\n\n## 年齢別なら、私はこう選ぶ\n### 0〜2歳\n- 長時間滞在より、授乳・おむつ替え・昼寝のしやすさ優先\n- 福岡市科学館や大型商業施設など、休憩しやすい場所を中心に\n\n### 3〜6歳\n- アンパンマンミュージアム\n- 水族館\n- 短時間の体験型施設\n\n### 小学生\n- 福岡市科学館\n- teamLab Forest\n- 水族館\n- 博物館・九州国立博物館\n\n## 雨の日に持っておくと助かるもの\n- 子どもの靴下\n- 薄手の着替え\n- 小さめタオル\n- ビニール袋\n- 折りたたみ傘\n- ベビーカー用レインカバー\n- モバイルバッテリー\n\n## 雨の日旅行で一番もったいないのは、親が残念そうにすること\n子どもは「晴れた福岡」を知らないので、比べません。\n\n大人だけが「本当は公園に行くはずだった」と思っています。だからこそ、予定変更を失敗だと思わないことが大切です。\n\n雨音を聞きながら水族館へ行ったこと、傘を差して地下鉄まで走ったこと、帰りに温かいものを食べたこと。その全部が旅行の記憶になります。\n\n雨の日でも「楽しかったね」で終われれば、その旅は大成功です。\n\n※営業時間・休館日・予約方法は変更される場合があります。各施設の公式情報を確認してからお出かけください。"}, {"id": "nagasaki-family-gourmet", "title": "長崎で子どもと食べたいご当地グルメ5選｜ちゃんぽん・トルコライス・カステラまで家族で満喫", "excerpt": "長崎は「何を食べるか」まで旅の思い出になる街。ちゃんぽん、皿うどん、トルコライス、角煮まん、カステラを、子どもと無理なく楽しむコツと一緒に紹介します。", "tags": ["長崎", "子連れグルメ", "ちゃんぽん", "トルコライス", "カステラ"], "ageGroups": ["3-6歳", "7歳以上"], "practical": ["昼食は11時台が動きやすい", "取り分け用の小皿を確認", "食べ歩きは1〜2品ずつ", "アレルギーは店舗へ直接確認"], "seo": {"metaDescription": "長崎の子連れ旅行で食べたいご当地グルメ5選。ちゃんぽん、皿うどん、トルコライス、角煮まん、カステラを家族で楽しむコツを紹介します。", "keywords": "長崎 子連れ グルメ,長崎 ちゃんぽん 子供,長崎 トルコライス,長崎 カステラ,長崎 家族旅行"}, "content": "## 長崎は「食べること」が街歩きそのものになる\n長崎を歩いていると、街の景色と食文化がつながっていると感じます。中華街、昔ながらの喫茶店、カステラの店。少し歩くたびに「次は何を食べよう」と話したくなる街です。\n\n子連れ旅行では、高級店を何軒も回るより、家族で少しずつ長崎らしい味を重ねていくほうが楽しい。私なら一日で全部制覇しようとせず、昼・おやつ・夜に分けます。\n\n## 1. ちゃんぽん｜最初の一杯は、家族で取り分けても楽しい\n長崎を代表する料理のひとつ、ちゃんぽん。野菜、魚介、肉、麺が一杯に入り、見た目からして「旅先の料理を食べている」という感じがあります。\n\n子どもには具材の好みがあるので、いきなり一人前を頼むより、大人の分から少し取り分けて反応を見るのもおすすめです。熱いスープには注意してください。\n\n長崎の街で食べるちゃんぽんは、単なる麺料理ではなく、旅のスイッチを入れてくれる味だと思います。\n\n## 2. 皿うどん｜パリパリ食感が子どもにハマることも\n皿うどんは、細麺のパリパリした食感が楽しく、ちゃんぽんとは全く違う魅力があります。\n\n餡が熱いことがあるので、子どもに取り分けるときは少し冷ましてから。家族でちゃんぽんと皿うどんを1皿ずつ注文し、シェアすると両方楽しめます。\n\n「どっちが好き？」と家族で話すのも旅の楽しみです。\n\n## 3. トルコライス｜子どもの「好き」が一皿に集まったような長崎洋食\nピラフ、スパゲティ、トンカツなどを一皿に盛り付けるトルコライス。店ごとに組み合わせや味付けが違うのも面白いところです。\n\n子どもが見た瞬間に「これ食べたい」と言いやすい、分かりやすい華やかさがあります。家族で入りやすい洋食店・喫茶店を選べば、長崎らしさを気軽に楽しめます。\n\n昔ながらの店内でトルコライスを待つ時間も、街の歴史を感じるひとときです。\n\n## 4. 角煮まん｜食べ歩きは「1個を半分こ」くらいがちょうどいい\nふわっとした生地に甘辛い角煮。食べ歩きしやすいサイズですが、子どもには意外とボリュームがあります。\n\n私なら家族で1個買って、まずは半分こ。おいしければもう1個。旅行中は「食べなきゃ」ではなく、「少し試してみよう」の感覚のほうが最後まで食を楽しめます。\n\n## 5. カステラ｜ホテルに戻ってから食べるのもおすすめ\nカステラはお土産のイメージが強いですが、旅の途中のおやつにもぴったりです。\n\n街歩きで疲れたあと、ホテルの部屋でお茶や牛乳と一緒に食べる。派手ではないけれど、家族旅行ではそんな時間が妙に記憶に残ります。\n\n底のザラメの食感が好きかどうか、子どもと感想を言い合うのも楽しいです。\n\n## 子連れで長崎グルメを楽しむ3つのコツ\n### 1. お昼は少し早めに\n11時台に食べ始めるくらいだと、混雑を避けやすく、子どもがお腹を空かせすぎる前に入店できます。\n\n### 2. 「名店」より「今入りやすい店」を選ぶ日があっていい\n行列が長ければ予定変更。旅行で一番大切なのは、家族の機嫌です。\n\n### 3. 食べ歩きは量を控えめに\n角煮まん、カステラ、スイーツ。全部食べたいからこそ、一度に買いすぎないのがコツです。\n\n## 私ならこんな食べ方をする\n- 昼：ちゃんぽん＋皿うどんを家族でシェア\n- 15時：カステラかミルクセーキで休憩\n- 夕方：角煮まんを軽く食べ歩き\n- 夜：子どもの体力が残っていればトルコライスや海鮮\n\n「長崎に来たらこれを食べなければ」と義務にしないこと。お腹が空いたときに、その街らしいものを一つ食べる。それだけで十分に旅らしくなります。\n\n## 長崎の味は、家に帰ってからもう一度思い出す\n旅行中は子どもの世話で慌ただしく、味をゆっくり覚えていないこともあります。\n\nでも家に帰って写真を見たとき、「あの皿うどんパリパリだったね」「角煮まん熱かったね」と会話が始まる。その瞬間に、料理が思い出に変わります。\n\n長崎は、家族の会話まで持ち帰れる食の街です。\n\n※営業時間・メニュー・子ども向け設備・アレルギー対応は店舗ごとに異なります。来店前に最新情報をご確認ください。"}, {"id": "miyazaki-baby-trip", "title": "赤ちゃん連れ宮崎旅行の持ち物完全ガイド｜青島ドライブを無理なく楽しむコツ", "excerpt": "赤ちゃんとの宮崎旅行は、観光地の数より「休める場所」を先に決めるのがコツ。持ち物、車移動、青島エリアの回り方、暑さ対策まで親目線でまとめました。", "tags": ["宮崎", "赤ちゃん連れ", "持ち物", "青島", "家族旅行"], "ageGroups": ["0-2歳"], "practical": ["昼寝時間を旅程に入れる", "車内の暑さ対策を優先", "おむつ・着替えは1日分を小バッグへ", "海辺は抱っこ紐も併用"], "seo": {"metaDescription": "赤ちゃん連れ宮崎旅行の持ち物と移動のコツを詳しく解説。青島を中心に、昼寝・授乳・おむつ替え・暑さ対策を優先した無理のない家族旅行プランを紹介します。", "keywords": "宮崎 赤ちゃん連れ,宮崎 子連れ 旅行,青島 赤ちゃん,赤ちゃん 旅行 持ち物,宮崎 家族旅行"}, "content": "## 赤ちゃんとの宮崎旅行は「観光」より先に休憩場所を決める\n赤ちゃんを連れて旅行すると、出発前はどうしても荷物のことばかり考えます。でも実際に一番困るのは、「今寝そう」「今ミルクを飲ませたい」「今おむつを替えたい」という予定表にないタイミングです。\n\nだから私なら、宮崎旅行では観光地より先に「ここで休める」を決めます。\n\n南国らしい景色をたくさん見るより、赤ちゃんが機嫌よく過ごせた時間のほうが、親にとっても満足度は高くなります。\n\n## まず用意したい「すぐ使うバッグ」\n大きな旅行バッグとは別に、車から降りるとき毎回持つ小バッグを作ります。\n\n- おむつ4〜5枚\n- おしりふき\n- ビニール袋\n- 着替え1セット\n- ガーゼ・タオル\n- ミルク用品または授乳ケープ\n- 飲み物\n- 小さなおもちゃ\n- 母子手帳・保険証類\n- 日焼け・暑さ対策用品\n\nポイントは「全部持つ」ではなく「今から2〜3時間で使うものだけ」にすること。大荷物を毎回車から下ろすと、親が先に疲れてしまいます。\n\n## 宮崎では車移動を基本に考えると組みやすい\n観光地が点在する宮崎は、家族旅行では車が便利な場面が多いです。ただし赤ちゃんにとって、長時間ずっとチャイルドシートに座るのは負担になります。\n\n私なら1時間前後を目安に「一度降りる理由」を作ります。道の駅、カフェ、景色の良い場所。大人の観光休憩ではなく、赤ちゃんの姿勢を変えるための休憩です。\n\n## 青島は「全部歩く」より、海を見られたら十分\n宮崎市街や空港からアクセスしやすい青島エリアは、初めての宮崎旅行でも組み込みやすい場所です。\n\n青島の周辺は南国らしい雰囲気があり、海が見えた瞬間に「宮崎へ来た」と感じられます。\n\nただ、赤ちゃん連れで砂浜・参道・島内を全部歩こうとすると負担が大きくなることがあります。ベビーカーだけでなく抱っこ紐も用意しておくと安心です。\n\n私なら赤ちゃんが寝ていれば無理に起こしません。親だけで海を眺め、写真を一枚撮る。それでもちゃんと旅行です。\n\n## 青島周辺で大切なのは「暑さ」\n宮崎は日差しが強い日があります。特に車を停めた直後の車内や、海辺で長時間過ごすときは注意が必要です。\n\n- 車に乗せる前に車内温度を下げる\n- 日陰を選ぶ\n- 帽子・日よけを使う\n- 水分補給をこまめに\n- 真昼の屋外滞在を長くしない\n\n赤ちゃんの顔色や汗のかき方を見て、「まだ行けそう」ではなく「今休もう」で動くのが安全です。\n\n## 私ならこうする｜赤ちゃん連れ宮崎1日プラン\n### 9:30 ゆっくり出発\n朝の支度で遅れても気にしません。赤ちゃん旅行では、時間通りに出られたらラッキーくらいで十分です。\n\n### 10:30 青島エリア\n海辺を散歩。赤ちゃんが寝ていれば、そのまま静かに景色を楽しみます。\n\n### 11:30 早めの昼食\n混雑前に食べます。離乳食期なら持ち込み可否や子ども椅子の有無を事前確認。\n\n### 13:00 車で昼寝時間\n移動そのものを昼寝時間にします。\n\n### 14:00 道の駅や景色の良い場所で休憩\n堀切峠や道の駅フェニックス方面へ行く場合も、滞在時間は赤ちゃん優先。親は景色を見て深呼吸するだけでも気分転換になります。\n\n### 16:00 ホテルへ\n夕方まで観光しない。これが赤ちゃん連れ宮崎旅で一番おすすめしたいことです。\n\n## ホテル選びで確認したいこと\n- ベビーベッドやベッドガード\n- 部屋風呂の使いやすさ\n- 電子レンジや調乳設備\n- コインランドリー\n- 駐車場から部屋までの距離\n- 朝食会場の子ども椅子\n\n設備は宿ごとに異なるため、予約時に「赤ちゃん連れです」と伝えて確認するのが確実です。\n\n## 持っていきすぎなくても大丈夫\n赤ちゃん旅行は不安だから荷物が増えます。でも、本当に大切なのは完璧な装備ではありません。\n\n途中で泣いて予定を変える。ホテルに早く戻る。行きたかった場所を1つ諦める。それを「失敗」にしないこと。\n\n海を見たときの風、初めてのホテルで眠る顔、帰りの車でぐっすり寝ている姿。宮崎で家族が一緒に過ごしたこと自体が、もう十分な思い出です。"}, {"id": "kagoshima-family-spot", "title": "鹿児島の家族旅行で外せない定番スポット6選｜桜島・水族館・動物園を子どもと満喫", "excerpt": "初めての鹿児島家族旅行なら、桜島・水族館・仙巌園・動物園を軸にすると失敗しにくい。子どもの年齢と天気に合わせた6スポットの楽しみ方を紹介します。", "tags": ["鹿児島", "子連れ", "桜島", "水族館", "家族旅行"], "ageGroups": ["3-6歳", "7歳以上"], "practical": ["桜島の降灰状況を確認", "屋外と屋内を組み合わせる", "フェリー移動も観光時間として楽しむ", "夏は暑さ対策を徹底"], "seo": {"metaDescription": "鹿児島の家族旅行でおすすめの定番スポット6選。桜島フェリー、湯之平展望所、いおワールドかごしま水族館、仙巌園、平川動物公園、維新ふるさと館を子連れ目線で紹介。", "keywords": "鹿児島 子連れ 観光,鹿児島 家族旅行,桜島 子供,鹿児島 水族館,鹿児島 動物園"}, "content": "## 鹿児島は「移動そのもの」が子どもの思い出になる\n鹿児島の家族旅行で面白いのは、観光地だけではありません。\n\n桜島へ向かうフェリー、車窓から見える火山、路面電車。子どもにとっては、大人がただの移動だと思っている時間までイベントになります。\n\n私なら初めての鹿児島では、「桜島」「海の生き物」「動物」の3つを軸にします。天候が崩れたら屋内へ切り替えられるようにしておけば、家族旅行がぐっとラクになります。\n\n## 1. 桜島フェリー｜まずは船に乗ること自体を楽しむ\n桜島へ渡るフェリーは、子どもにとって分かりやすく楽しい体験です。\n\n出港して景色が動き始めると、普通の道路移動とは違う高揚感があります。私なら「桜島を見るための移動」ではなく、フェリーそのものを観光として予定に入れます。\n\n風が強い日や小さい子がいる場合は、安全第一で船内から景色を楽しみましょう。\n\n## 2. 湯之平展望所周辺｜桜島の大きさを身体で感じる\n桜島は市街地から眺めても存在感がありますが、近づくと印象が変わります。\n\n子どもに火山の仕組みを詳しく説明できなくても、「この山が今も活動しているんだよ」と一緒に眺めるだけで十分。教科書より先に、本物を見る経験になります。\n\n降灰・道路・火山活動の情報は当日確認してください。\n\n## 3. いおワールドかごしま水族館｜雨の日にも頼れる定番\n子連れ鹿児島で、天候に左右されにくい場所を1つ挙げるなら水族館は強い候補です。\n\n大きな水槽の前で、子どもが黙って魚を見つめる時間。親にとっても少し休める時間です。\n\n桜島フェリー乗り場周辺と組み合わせやすいのも旅程上のメリット。午前に桜島、午後に水族館という流れも組みやすいです。\n\n## 4. 仙巌園｜「景色」と「歴史」を家族のペースで\n庭園から桜島を望む景色は、鹿児島らしさを感じやすい場所のひとつです。\n\n小さい子に歴史を理解してもらおうと頑張らなくて大丈夫。広い庭を歩き、景色を見て、おやつを食べる。それだけでも家族で楽しめます。\n\n小学生なら「昔の人はここから同じ桜島を見ていた」と伝えると、少しだけ歴史が身近になります。\n\n## 5. 平川動物公園｜動物好きなら半日確保したい\n動物園は子どもの年齢を問わず楽しみやすい場所です。平川動物公園はコアラでも知られ、ゆっくり回るなら時間に余裕を持ちたいところ。\n\n私なら午後遅くに詰め込まず、午前から行きます。動物園は歩く距離が増えやすいため、途中でしっかり休む時間も旅程に含めます。\n\n## 6. 維新ふるさと館など市街地の屋内スポット｜天気が崩れた日の逃げ道に\n家族旅行では「雨ならここ」という場所を1つ決めておくと安心です。\n\n鹿児島中央駅や市街地周辺で過ごせる屋内施設を候補にしておけば、天気や子どもの疲れ具合に合わせてすぐ予定変更できます。\n\n## 私ならこう回る｜1泊2日の王道プラン\n### 1日目\n- 午前：鹿児島市到着\n- 昼前：桜島フェリー\n- 午後：桜島を無理なく観光\n- 夕方：ホテルへ早めに戻る\n\n### 2日目\n晴れなら平川動物公園や仙巌園。雨なら水族館＋市街地の屋内施設へ。\n\nこの「晴れルート」「雨ルート」を前日に決めるだけで、朝から悩まずに済みます。\n\n## 子どもと鹿児島を歩いて感じたいこと\n桜島は、どこから見ても同じようで、時間や天気によって表情が変わります。\n\n旅の途中で何度も「あ、また桜島見える」と子どもが気づく。そのたびに、鹿児島の景色が少しずつ家族の記憶になっていきます。\n\n有名スポットを6カ所全部回る必要はありません。2つ、3つでも、家族が笑って過ごせたなら十分です。\n\n※火山情報、施設営業時間、料金、休園・休館日は変更されることがあります。出発前に公式情報をご確認ください。"}, {"id": "saga-onsen-family", "title": "佐賀で子連れ温泉旅｜嬉野・武雄を無理なく楽しむ1泊2日モデルプラン", "excerpt": "嬉野・武雄の温泉旅は、子どもと大人の「やりたい」を両方かなえやすいのが魅力。温泉、遊び、豆腐スイーツを詰め込みすぎず楽しむ1泊2日プランです。", "tags": ["佐賀", "嬉野温泉", "武雄温泉", "子連れ", "家族旅行"], "ageGroups": ["0-2歳", "3-6歳", "7歳以上"], "practical": ["温泉は短時間から試す", "宿の家族風呂・貸切風呂は事前確認", "車移動中心なら昼寝時間を移動に合わせる", "温泉後の水分補給を忘れない"], "seo": {"metaDescription": "佐賀の嬉野・武雄エリアを子どもと楽しむ1泊2日温泉旅。温泉、メルヘン村、嬉野グルメを家族のペースで回るモデルプランと、温泉デビューのコツを紹介。", "keywords": "佐賀 子連れ 温泉,嬉野温泉 子連れ,武雄温泉 家族旅行,佐賀 子供 旅行,嬉野 子供"}, "content": "## 佐賀の温泉旅は、大人だけが楽しい旅にしなくていい\n「温泉旅行に行きたい。でも子どもが退屈しそう」\n\nそんなときに嬉野・武雄エリアは組みやすい場所です。温泉で大人が休み、昼間は子どもが遊ぶ。どちらかに我慢させるのではなく、一日の中で交代するように予定を組めます。\n\n私なら、温泉を旅の中心に置きながらも「子どもが主役になる時間」を必ず1つ入れます。\n\n## 1日目 10:30 武雄・嬉野エリアへ\n朝早く出発しすぎないことから始めます。子どもがいると、出発前だけでかなり体力を使います。\n\n車移動なら途中で休憩を入れ、着いた時点でみんなが疲れ切っていない状態を目指します。\n\n## 11:30 早めのランチ\n嬉野周辺なら温泉湯どうふなど、地域らしい食事も楽しみたいところです。\n\nただし子どもが豆腐料理を食べるとは限りません。親が食べたいものと、子どもが確実に食べられるものを両方注文できる店を選ぶと安心です。\n\n「せっかく佐賀だから全部名物にする」より、家族全員が気持ちよく食事できることを優先します。\n\n## 13:00 子どもの時間｜メルヘン村など遊べるスポットへ\n佐賀県の公式観光モデルコースでも、嬉野・武雄エリアの家族向けスポットとして遊園地や小動物とのふれあいを組み合わせています。\n\n温泉に入る前に、まず子どもにしっかり遊んでもらう。これがポイントです。\n\n身体を動かしたあとなら、宿に戻ってからの切り替えも比較的スムーズになります。\n\n## 15:30 チェックイン｜ここから予定を入れすぎない\n宿に着いたら、その日はもう「観光を追加しない」と決めてもいいくらいです。\n\n部屋でお茶を飲む、子どもは少し昼寝、親は荷物を整理。温泉旅では、この何もしない時間が贅沢です。\n\n## 子どもの温泉デビューは「短く、無理しない」\n初めての温泉で大切なのは、長く入ることではありません。\n\n- お湯の温度を確認\n- まずは短時間\n- 入浴前後に水分補給\n- 眠い・空腹・機嫌が悪いときは無理しない\n- おむつが外れていない場合の利用ルールは宿へ確認\n\n家族風呂や貸切風呂が選べる宿なら、周囲を気にせず家族のペースで入れることがあります。設備・利用条件は宿ごとに異なるので事前確認がおすすめです。\n\n## 夕食後は「もう一度温泉」より、子どもの睡眠優先でもいい\n大人はせっかくの温泉だから何度も入りたくなります。でも子どもが眠そうなら、寝かせることを優先。\n\n交代で温泉に入れるなら、片方が子どもと部屋で過ごし、もう片方がゆっくり入る方法もあります。\n\n家族全員で同じ行動をし続けなくてもいい。それが子連れ温泉旅をラクにする考え方です。\n\n## 2日目 朝風呂は、起きられた人だけ\n朝早く起きたら、静かな温泉へ。子どもが寝ているなら無理に起こしません。\n\n朝食後も急いで出発せず、チェックアウト時間まで少しゆっくり。温泉宿では「滞在そのもの」が観光です。\n\n## 10:30 嬉野で甘いもの休憩\n嬉野では温泉だけでなく、お茶や豆腐を生かしたグルメも楽しみです。\n\n子どもと一緒なら、スイーツを1つ選ぶ時間も立派な観光。大人はお茶を飲み、子どもは甘いもの。家族それぞれが満足できる休憩にします。\n\n## 12:00 早めの昼食、そのまま帰路へ\n2日目の午後まで予定を詰めないのが、私ならおすすめです。\n\n帰宅後の片付けや翌日の予定まで考えると、少し早く帰るほうが「また旅行したい」と思える余力が残ります。\n\n## 佐賀の温泉旅で感じたいのは、静かな贅沢\n派手なテーマパークを一日中回る旅とは違い、温泉旅には「何もしない時間」があります。\n\n湯上がりの子どもの赤いほっぺ。部屋でゴロゴロしている姿。朝食をいつもよりゆっくり食べる時間。\n\nそんな普通の場面が、家ではなぜかできない。\n\n佐賀の温泉旅は、家族で少しだけ速度を落とす旅です。観光地を何カ所回れたかではなく、「今日はゆっくりできたね」と言って帰れることを大切にしたいと思います。\n\n※温泉の利用条件、家族風呂、子ども向け設備、施設営業時間などは変更される場合があります。予約・訪問前に公式情報をご確認ください。"}];

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
  if (opts.q) {
    where.push("(title LIKE ? OR excerpt LIKE ? OR content LIKE ?)");
    const q = "%" + opts.q + "%";
    binds.push(q, q, q);
  }
  if (opts.featured) where.push("featured = 1");
  if (opts.published !== false) {
    where.push("published = 1");
    where.push("(date IS NULL OR date = '' OR date <= ?)");
    binds.push(todayJst());
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY COALESCE(updatedAt, date) DESC, date DESC";
  const stmt = db.prepare(sql);
  const r = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
  return (r.results || []).map(normalizeRow);
}


function isAllowedArticleImageUrl(value) {
  try {
    const u = new URL(String(value || ""));
    if (!["https:","http:"].includes(u.protocol)) return false;
    const h = u.hostname.toLowerCase();

    // Only proxy known Rakuten/Rakuten Travel image infrastructure.
    const allowed = [
      "rakuten.co.jp",
      "r10s.jp",
      "rakuten-static.com",
      "rakuten.com",
      "rakutentravel.com"
    ];
    return allowed.some(domain => h === domain || h.endsWith("." + domain));
  } catch {
    return false;
  }
}

function imageFallbackSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
    <rect width="1200" height="700" rx="36" fill="#f3f8f6"/>
    <circle cx="600" cy="310" r="68" fill="#dfece7"/>
    <path d="M565 330l48-58 65 82H522z" fill="#9bbab0"/>
    <text x="600" y="440" text-anchor="middle" font-size="34" font-family="sans-serif" fill="#60776f">写真を読み込めませんでした</text>
  </svg>`;
  return new Response(svg, {
    status: 200,
    headers:{
      "content-type":"image/svg+xml; charset=utf-8",
      "cache-control":"public, max-age=300"
    }
  });
}


function articleImageCategoryFromAlt(alt = "") {
  const s = String(alt || "");
  if (/食事|朝食|夕食|レストラン|料理|ビュッフェ|バイキング/.test(s)) return "meal";
  if (/プール|水遊び|アクア|ウォーター/.test(s)) return "pool";
  if (/温泉|お風呂|浴場|大浴場|露天/.test(s)) return "bath";
  if (/客室|内装|部屋|ベッド/.test(s)) return "room";
  if (/宿泊プラン/.test(s)) return "plan";
  if (/外観|館内|施設|ロビー/.test(s)) return "facility";
  return "other";
}

async function fetchImageResponse(src) {
  if (!isAllowedArticleImageUrl(src)) return null;

  const attempts = [
    {
      "user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      "accept":"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "referer":"https://travel.rakuten.co.jp/"
    },
    {
      "user-agent":"Mozilla/5.0 AppleWebKit/537.36 Chrome/126 Safari/537.36",
      "accept":"image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
    }
  ];

  for (const headers of attempts) {
    try {
      const r = await fetch(src, {method:"GET", headers, redirect:"follow"});
      const ct = String(r.headers.get("content-type") || "").toLowerCase();
      if (r.ok && ct.startsWith("image/")) return r;
    } catch {}
  }
  return null;
}

async function loadFreshArticleGallery(request, env, articleId) {
  if (!articleId || !env.DB || !env.RAKUTEN_APPLICATION_ID || !env.RAKUTEN_ACCESS_KEY) {
    return [];
  }

  const cache = caches.default;
  const requestUrl = new URL(request.url);
  const cacheKey = new Request(requestUrl.origin + "/__fresh-gallery-cache?id=" + encodeURIComponent(articleId));

  const cached = await cache.match(cacheKey);
  if (cached) {
    try {
      const data = await cached.json();
      if (Array.isArray(data?.images)) return data.images;
    } catch {}
  }

  const rows = await listArticles(env.DB, {id:articleId, published:false});
  const article = rows[0];
  if (!article) return [];

  const hotelName = extractHotelNameFromArticle(article);
  if (!hotelName) return [];

  const params = new URLSearchParams({
    applicationId: env.RAKUTEN_APPLICATION_ID,
    accessKey: env.RAKUTEN_ACCESS_KEY,
    format: "json",
    formatVersion: "2",
    keyword: hotelName,
    searchField: "0",
    hits: "10",
    responseType: "middle",
    hotelThumbnailSize: "3"
  });
  if (env.RAKUTEN_AFFILIATE_ID) params.set("affiliateId", env.RAKUTEN_AFFILIATE_ID);

  const searchRes = await rakutenServerFetch(
    "https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20260731?" + params.toString(),
    env
  );
  if (!searchRes.ok) return [];

  const candidates = normalizeHotelCandidates(searchRes.data);
  if (!candidates.length) return [];

  const compact = s => String(s || "").replace(/[　\s・･\-ー－（）()【】『』「」]/g, "").toLowerCase();
  const target = compact(hotelName);

  let selected =
    candidates.find(h => compact(h.hotelName) === target) ||
    candidates.find(h => compact(h.hotelName).includes(target) || target.includes(compact(h.hotelName))) ||
    candidates[0];

  if (selected?.hotelNo) {
    const detailed = await fetchRakutenHotelDetail(selected.hotelNo, env);
    if (detailed) selected = {...selected, ...detailed};
  }

  const source = Array.isArray(selected?.imageGallery) ? selected.imageGallery : [];
  const images = [];
  const seen = new Set();

  for (const img of source) {
    if (!img?.url || img.isThumbnail || !isAllowedArticleImageUrl(img.url)) continue;
    const key = canonicalArticleImageKey(img.url);
    if (seen.has(key)) continue;
    seen.add(key);
    images.push({
      url: img.url,
      category: img.category || "other"
    });
  }

  // Common fields are kept as fallback if imageGallery is sparse.
  const fallbackFields = [
    ["hotel", selected?.hotelImageUrl],
    ["room", selected?.roomImageUrl],
    ["plan", selected?.planImageUrl],
    ["hotel", selected?.hotelThumbnailUrl],
    ["room", selected?.roomThumbnailUrl]
  ];
  for (const [category, url] of fallbackFields) {
    if (!url || !isAllowedArticleImageUrl(url)) continue;
    const key = canonicalArticleImageKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    images.push({url, category});
  }

  const response = new Response(JSON.stringify({images}), {
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"public, max-age=21600"
    }
  });
  try {
    await cache.put(cacheKey, response.clone());
  } catch {}

  return images;
}

async function articleFreshImage(request, env) {
  const url = new URL(request.url);
  const articleId = url.searchParams.get("id") || "";
  const alt = url.searchParams.get("alt") || "";
  const slot = Math.max(1, Number(url.searchParams.get("slot") || 1));
  const oldSrc = url.searchParams.get("src") || "";

  // If the old URL still works server-side, keep using it.
  const oldResponse = await fetchImageResponse(oldSrc);
  if (oldResponse) {
    const headers = new Headers();
    headers.set("content-type", oldResponse.headers.get("content-type") || "image/jpeg");
    headers.set("cache-control", "public, max-age=86400, s-maxage=604800");
    return new Response(oldResponse.body, {status:200, headers});
  }

  const gallery = await loadFreshArticleGallery(request, env, articleId);
  if (!gallery.length) return new Response(null, {status:404});

  const wanted = articleImageCategoryFromAlt(alt);
  const preferredCategories = wanted === "facility"
    ? ["facility","hotel","other","plan"]
    : [wanted,"other","facility","hotel","plan"];

  const ordered = [];
  const used = new Set();
  for (const category of preferredCategories) {
    for (const img of gallery) {
      if (img.category !== category || used.has(img.url)) continue;
      used.add(img.url);
      ordered.push(img);
    }
  }
  for (const img of gallery) {
    if (used.has(img.url)) continue;
    used.add(img.url);
    ordered.push(img);
  }

  if (!ordered.length) return new Response(null, {status:404});

  // Start near the corresponding image slot, then try the rest.
  const start = (slot - 1) % ordered.length;
  for (let i = 0; i < ordered.length; i++) {
    const candidate = ordered[(start + i) % ordered.length];
    const imageResponse = await fetchImageResponse(candidate.url);
    if (!imageResponse) continue;

    const headers = new Headers();
    headers.set("content-type", imageResponse.headers.get("content-type") || "image/jpeg");
    headers.set("cache-control", "public, max-age=86400, s-maxage=604800");
    return new Response(imageResponse.body, {status:200, headers});
  }

  return new Response(null, {status:404});
}


function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function imageResponseFromSource(src, request, env) {
  try {
    const pageUrl = new URL(request.url);
    const absolute = new URL(src, pageUrl.origin);

    if (absolute.origin === pageUrl.origin) {
      if (absolute.pathname === "/media/article-image") {
        return await articleFreshImage(new Request(absolute.toString(), {method:"GET"}), env);
      }
      if (absolute.pathname === "/media/image") {
        return await articleImageProxy(new Request(absolute.toString(), {method:"GET"}));
      }
      return null;
    }

    if (!isAllowedArticleImageUrl(absolute.toString())) return null;
    return await fetchImageResponse(absolute.toString());
  } catch {
    return null;
  }
}

async function imageFingerprint(request, env) {
  const url = new URL(request.url);
  const src = url.searchParams.get("src") || "";
  if (!src) return json({ok:false,error:"missing src"}, {status:400});

  const cache = caches.default;
  const cacheKey = new Request(
    url.origin + "/__image-fingerprint-cache?src=" + encodeURIComponent(src)
  );

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const imageResponse = await imageResponseFromSource(src, request, env);
  if (!imageResponse || !imageResponse.ok) {
    return json({ok:false}, {status:404});
  }

  const contentType = String(imageResponse.headers.get("content-type") || "").toLowerCase();
  if (!contentType.startsWith("image/")) {
    return json({ok:false}, {status:415});
  }

  let buffer;
  try {
    buffer = await imageResponse.arrayBuffer();
  } catch {
    return json({ok:false}, {status:502});
  }

  // Avoid hashing pathological responses.
  if (!buffer.byteLength || buffer.byteLength > 12 * 1024 * 1024) {
    return json({ok:false}, {status:413});
  }

  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hash = bytesToHex(digest);
  const response = json({
    ok:true,
    hash,
    bytes:buffer.byteLength,
    contentType
  }, {
    headers:{"cache-control":"public, max-age=604800, s-maxage=2592000"}
  });

  try {
    await cache.put(cacheKey, response.clone());
  } catch {}

  return response;
}

async function articleImageProxy(request) {
  const url = new URL(request.url);
  const src = url.searchParams.get("src") || "";
  if (!isAllowedArticleImageUrl(src)) return imageFallbackSvg();

  const fetchHeaders = {
    "user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    "accept":"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "referer":"https://travel.rakuten.co.jp/"
  };

  try {
    let res = await fetch(src, {
      method:"GET",
      headers:fetchHeaders,
      redirect:"follow"
    });

    // Some image hosts dislike Referer; retry once without it.
    if (!res.ok) {
      const retryHeaders = {...fetchHeaders};
      delete retryHeaders.referer;
      res = await fetch(src, {
        method:"GET",
        headers:retryHeaders,
        redirect:"follow"
      });
    }

    if (!res.ok) return imageFallbackSvg();

    const contentType = String(res.headers.get("content-type") || "").toLowerCase();
    if (!contentType.startsWith("image/")) return imageFallbackSvg();

    const headers = new Headers();
    headers.set("content-type", contentType);
    headers.set("cache-control", "public, max-age=86400, s-maxage=604800");
    const len = res.headers.get("content-length");
    if (len) headers.set("content-length", len);
    return new Response(res.body, {status:200, headers});
  } catch {
    return imageFallbackSvg();
  }
}

function markdownLite(src = "", articleId = "") {
  const safe = esc(src);
  let h2Index = 0;
  let imageIndex = 0;
  return safe
    .replace(/^&gt; POINT: (.+)$/gm, '<div class="editorPoint"><div class="familyTipIcon">💡</div><div><b>家族旅行ポイント</b><span>$1</span></div></div>')
    .replace(/^&gt; CHECK: (.+)$/gm, '<div class="checkPoint"><div class="familyTipIcon">✅</div><div><b>予約前チェック</b><span>$1</span></div></div>')
    .replace(/^&gt; MEMO: (.+)$/gm, '<div class="memoPoint"><div class="familyTipIcon">📝</div><div><b>ひとことメモ</b><span>$1</span></div></div>')
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, function(_, alt, rawUrl) {
      imageIndex += 1;
      const htmlUrl = String(rawUrl || "");
      const imageUrl = htmlUrl.replace(/&amp;/g, "&");
      const fresh = "/media/article-image?id=" + encodeURIComponent(articleId || "") + "&alt=" + encodeURIComponent(String(alt || "")) + "&slot=" + imageIndex + "&src=" + encodeURIComponent(imageUrl);
      return `<figure class="articlePhoto"><img src="${htmlUrl}" data-fresh="${fresh}" alt="${alt}" loading="lazy" decoding="async" onerror="if(this.dataset.fallback!=='1'){this.dataset.fallback='1';this.src=this.dataset.fresh}else{this.onerror=null;const f=this.closest('figure');if(f)f.remove()}"><figcaption>${alt}</figcaption></figure>`;
    })
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, function(_, title){ h2Index += 1; return '<h2 id="section-'+h2Index+'">'+title+'</h2>'; })
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");
}



function canonicalArticleImageKey(rawUrl = "") {
  try {
    const u = new URL(String(rawUrl || "").replace(/&amp;/g, "&"));
    ["size","width","height","w","h","quality","q","resize","fit","crop","format","fm","auto","_","cache","timestamp","ts"]
      .forEach(k => u.searchParams.delete(k));
    let path = decodeURIComponent(u.pathname || "").toLowerCase();
    path = path
      .replace(/(?:[_-](?:thumb|thumbnail|small|medium|large|s|m|l))(?=\.[a-z0-9]+$)/g, "")
      .replace(/(?:[_-]\d{2,4}x\d{2,4})(?=\.[a-z0-9]+$)/g, "")
      .replace(/\/(?:thumb|thumbnail|small|medium|large)\//g, "/")
      .replace(/\/+/g, "/");
    return u.hostname.toLowerCase() + path + (u.searchParams.toString() ? "?" + u.searchParams.toString() : "");
  } catch {
    return String(rawUrl || "").trim().toLowerCase();
  }
}

function removeDuplicateArticleImages(content = "") {
  const seen = new Set();
  const out = [];
  for (const line of String(content || "").split("\n")) {
    const m = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)\s*$/);
    if (!m) {
      out.push(line);
      continue;
    }
    const key = canonicalArticleImageKey(m[2]);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function cleanReaderFacingArticle(content = "") {
  let text = String(content || "");

  text = text.replace(/---\s*\n+\*\*編集方針と情報源\*\*[\s\S]*?(?=\n+\*\*広告について\*\*|$)/g, "");
  text = text.replace(/\*\*広告について\*\*[\s\S]*$/g, "");

  const lines = text.split("\n");
  const cleaned = [];

  for (let line of lines) {
    const raw = line.trim();

    // The image itself already has a caption. Hide duplicated markdown photo notes.
    if (/^\*.*(?:写真|画像).*[。.]?\*$/.test(raw)) {
      continue;
    }

    if (
      /楽天トラベル(?:施設情報)?API/.test(raw) ||
      /画像種別/.test(raw) ||
      /高解像度写真を取得できなかった/.test(raw) ||
      /別カテゴリの画像で代用/.test(raw) ||
      /外観写真を客室写真として代用/.test(raw) ||
      /取得できた画像種別/.test(raw) ||
      /誤解を避けて画像は掲載していません/.test(raw)
    ) {
      continue;
    }

    line = line
      .replace(/楽天トラベルから取得した/g, "")
      .replace(/楽天掲載写真/g, "ホテル写真")
      .replace(/ホテル選びの参考になる写真です。/g, "")
      .replace(/写真カテゴリを安全に判別できないため、誤った説明を付けず/g, "")
      .replace(/この記事の編集角度は「[^」]+」。/g, "")
      .replace(/^> POINT:\s*この記事の編集角度は「[^」]+」。/g, "> POINT: ");

    cleaned.push(line);
  }

  return removeDuplicateArticleImages(cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim());
}

function articleToc(content = "") {
  const rows = String(content || "").split("\n");
  const items = [];
  for (const row of rows) {
    const m = row.match(/^##\s+(.+)$/);
    if (m) items.push(m[1].trim());
  }
  return items.slice(0, 8);
}

function layout(title, body, extraHead = "") {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#168861">
<title>${esc(title)}</title>
${extraHead}
<style>
:root{--ink:#17372e;--green:#168861;--green2:#0f6f50;--soft:#eef7f3;--line:#d8e6df;--muted:#6f817b;--cream:#fffaf0;--shadow:0 16px 38px rgba(20,67,53,.08)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP",sans-serif;color:var(--ink);background:#fff;line-height:1.72}
a{color:inherit}.wrap{max-width:1080px;margin:auto;padding:0 20px}.header{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.95);border-bottom:1px solid var(--line);backdrop-filter:blur(14px)}
.headerin{min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{font-weight:900;font-size:22px;text-decoration:none;white-space:nowrap}.nav{display:flex;gap:22px}.nav a{text-decoration:none;font-weight:750}
.menuBtn{display:none;border:1px solid var(--line);background:var(--soft);border-radius:14px;width:50px;height:50px;font-size:25px}
.mobileNav{display:none;position:fixed;inset:78px 0 auto 0;background:#fff;border-bottom:1px solid var(--line);padding:16px 20px 22px;box-shadow:var(--shadow);z-index:29}
.mobileNav.open{display:grid;gap:8px}.mobileNav a{padding:13px 10px;text-decoration:none;font-weight:800;border-bottom:1px solid var(--soft)}
.hero{background:radial-gradient(circle at 90% 10%,#fff4ca 0,transparent 35%),linear-gradient(135deg,#edf8f3,#fffdf6);padding:76px 0 66px;border-bottom:1px solid #f0f4f2}.heroGrid{display:grid;grid-template-columns:1.2fr .8fr;gap:42px;align-items:center}
.hero h1{font-size:clamp(40px,7vw,72px);line-height:1.1;margin:10px 0 20px;letter-spacing:-.035em}.hero h1 span{color:var(--green)}.lead{font-size:20px;color:var(--muted);max-width:760px}
.heroPanel{border:1px solid var(--line);background:rgba(255,255,255,.82);border-radius:28px;padding:28px;box-shadow:var(--shadow)}.heroPanel .bigEmoji{font-size:70px}.heroPanel h3{font-size:25px;margin:8px 0}.heroPanel p{color:var(--muted);margin:0}
.btns{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0}.btn{display:inline-block;padding:14px 22px;border-radius:14px;background:var(--green);color:#fff;text-decoration:none;font-weight:850;border:1px solid var(--green);cursor:pointer}.btn:hover{filter:brightness(.97)}.btn.sub{background:#fff;color:var(--ink);border-color:var(--line)}
.chips{display:flex;gap:10px;flex-wrap:wrap}.chip{background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 14px}
.section{padding:64px 0}.section.soft{background:var(--soft)}.eyebrow{color:var(--green);font-weight:900;letter-spacing:.16em}.section h2{font-size:36px;margin:6px 0 26px}
.sectionHead{display:flex;align-items:end;justify-content:space-between;gap:20px}.more{color:var(--green);font-weight:850;text-decoration:none}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.card{border:1px solid var(--line);border-radius:24px;overflow:hidden;background:#fff;box-shadow:0 8px 24px rgba(20,67,53,.04);transition:.2s transform,.2s box-shadow}.card:hover{transform:translateY(-2px);box-shadow:var(--shadow)}
.cover{aspect-ratio:16/10;background:linear-gradient(135deg,#e7f7f1,#fff2cf);display:flex;align-items:center;justify-content:center;font-size:72px;overflow:hidden}.cover img{width:100%;height:100%;object-fit:cover}
.pad{padding:24px}.badges{display:flex;gap:8px;flex-wrap:wrap}.badge{font-size:13px;font-weight:850;background:var(--soft);color:var(--green2);padding:5px 10px;border-radius:999px}.card h3{font-size:23px;line-height:1.45;margin:12px 0}.meta{font-size:14px;color:var(--muted)}
.areaGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.area{background:#fff;border:1px solid var(--line);border-radius:22px;padding:28px;text-align:center;text-decoration:none;transition:.2s transform}.area:hover{transform:translateY(-2px)}.area .e{font-size:44px}
.article{max-width:820px;margin:auto;padding:48px 20px}.article h1{font-size:clamp(34px,6vw,56px);line-height:1.25}.article .heroimg{border-radius:24px;overflow:hidden;background:linear-gradient(135deg,#e7f7f1,#fff2cf);min-height:320px;display:flex;align-items:center;justify-content:center;font-size:92px}.article .heroimg img{width:100%;max-height:520px;object-fit:cover}.articleBody{font-size:18px}.articleBody h2{margin-top:38px}.affiliate{margin:36px 0;padding:24px;border:1px solid var(--line);border-radius:18px;background:#fbfffd}.affiliate a{display:inline-block;margin:6px 8px 6px 0;padding:10px 14px;border-radius:10px;background:var(--green);color:#fff;text-decoration:none;font-weight:750}
.familyArticle{max-width:900px;padding-top:26px}.articleBreadcrumb{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:var(--muted);font-size:13px;margin-bottom:16px}.articleBreadcrumb a{text-decoration:none}.familyHeroCard{border:1px solid var(--line);border-radius:30px;overflow:hidden;background:#fff;box-shadow:0 16px 44px rgba(23,55,46,.08)}
.familyHeroVisual{position:relative;min-height:360px;overflow:hidden;background:linear-gradient(135deg,#dff5ec,#fff1cb);display:flex;align-items:center;justify-content:center}.familyHeroVisual>img{width:100%;height:100%;min-height:360px;max-height:520px;object-fit:cover}.familyHeroEmoji{font-size:100px}.familyHeroShade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(14,55,45,.52),rgba(14,55,45,.03) 58%,rgba(255,255,255,.03))}.familyHeroCopy{position:absolute;left:34px;bottom:34px;color:#fff;display:grid;gap:4px;text-shadow:0 2px 12px rgba(0,0,0,.2)}.familyHeroCopy span{font-size:17px;font-weight:800}.familyHeroCopy b{font-size:26px;line-height:1.35;max-width:420px}.familyBubble{position:absolute;right:28px;top:26px;background:#fff9e8;color:var(--ink);border-radius:48% 52% 48% 52%;padding:17px 21px;font-size:14px;font-weight:850;line-height:1.45;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.1);transform:rotate(2deg)}
.familyHeroInfo{padding:28px 30px 30px}.familyHeroInfo h1{font-size:clamp(31px,5vw,48px);margin:12px 0 10px;letter-spacing:-.025em}.familyLead{font-size:18px;color:#405d54;margin:10px 0 20px}.areaBadge{background:#dff5ea!important}.catBadge{background:#fff0d6!important;color:#7c5b16!important}.familyFeatures{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-top:22px}.familyFeature{min-height:92px;border-radius:24px;display:grid;place-items:center;text-align:center;padding:10px 6px}.familyFeature span{font-size:26px}.familyFeature b{font-size:12px}.familyFeature.mint{background:#e9f8e6}.familyFeature.peach{background:#fff0ea}.familyFeature.blue{background:#e7f5ff}.familyFeature.yellow{background:#fff6d9}.familyFeature.sky{background:#eaf4ff}.familyFeature.pink{background:#fff0f4}
.familyBooking{margin:24px 0;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;border:1px solid #ecdca7;background:linear-gradient(135deg,#fff9df,#f3fbf7);border-radius:24px;padding:18px 20px}.familyBookingIcon{width:54px;height:54px;border-radius:18px;background:#0f6f50;color:#fff;display:grid;place-items:center;font-size:25px}.familyBookingText{display:grid;gap:2px}.familyBookingText small{font-size:11px;color:var(--muted)}.familyBookingText b{font-size:17px}.familyBookingText span{font-size:12px;color:var(--muted)}.familyBooking>a{background:#0f6f50;color:#fff;text-decoration:none;font-weight:900;border-radius:16px;padding:13px 16px;white-space:nowrap}
.familyToc{margin:24px 0;border:1px solid #eadfb7;background:#fffaf0;border-radius:24px;padding:20px}.familyTocHead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.familyTocHead>div{display:flex;align-items:center;gap:8px}.familyTocHead b{font-size:18px}.familyTocHead small{color:var(--muted)}.familyTocGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.familyTocGrid a{display:flex;gap:9px;align-items:center;text-decoration:none;background:#fff;border:1px solid #efe6c6;border-radius:999px;padding:9px 12px;font-weight:800;font-size:13px}.familyTocGrid a span{width:26px;height:26px;border-radius:50%;background:var(--green);color:#fff;display:grid;place-items:center;flex:0 0 auto}
.familyArticleBody{font-size:18px;color:#24443a;counter-reset:familysection}.familyArticleBody>p{margin:0}.familyArticleBody h2{counter-increment:familysection;margin:48px 0 20px;padding:17px 18px;border-radius:20px;background:linear-gradient(90deg,#e7f7f1,#f8fcfa);font-size:27px;line-height:1.35;display:flex;align-items:center;gap:12px}.familyArticleBody h2:before{content:counter(familysection);width:38px;height:38px;border-radius:50%;background:var(--green);color:#fff;display:grid;place-items:center;font-size:18px;font-weight:900;flex:0 0 auto}.familyArticleBody h3{margin:28px 0 12px;font-size:21px}.familyArticleBody p{line-height:2}.familyArticleBody ul{background:#fbfefd;border:1px solid var(--line);border-radius:20px;padding:18px 22px 18px 42px}.familyArticleBody li{margin:6px 0}.familyTipIcon{width:42px;height:42px;border-radius:15px;background:#fff;display:grid;place-items:center;font-size:20px;flex:0 0 auto}.editorPoint,.checkPoint,.memoPoint{display:flex!important;gap:12px!important;align-items:flex-start!important;border-radius:22px!important;padding:18px!important;margin:22px 0!important}.editorPoint{background:#eef9f5!important;border-left:5px solid #39a17c!important}.checkPoint{background:#fff9e9!important;border-left:5px solid #e1ad20!important}.memoPoint{background:#eef5fb!important;border-left:5px solid #7a9bb7!important}.editorPoint>div:last-child,.checkPoint>div:last-child,.memoPoint>div:last-child{display:grid;gap:4px}.articlePhoto{margin:26px 0 30px!important}.articlePhoto img{border-radius:24px!important;box-shadow:0 12px 30px rgba(20,67,53,.08)}.articlePhoto figcaption{padding:0 4px;color:var(--muted)}
.familySectionTitle{display:flex;align-items:center;gap:10px}.familySectionTitle span{font-size:24px}.familySectionTitle h2{margin:0;font-size:24px}.familyAffiliate{background:linear-gradient(135deg,#fff9e4,#f2fbf7);border-radius:24px}.familyAffiliateButtons{margin-top:14px}.familyAffiliateButtons a{border-radius:14px!important;padding:12px 16px!important}.familyAuthor{display:flex;gap:16px;align-items:flex-start;background:#f4fbf8;border:1px solid var(--line);border-radius:24px;padding:22px;margin:30px 0}.familyAuthorIcon{width:56px;height:56px;border-radius:18px;background:#fff;display:grid;place-items:center;font-size:27px;flex:0 0 auto}.familyAuthor p{margin:5px 0 8px;color:var(--muted)}.familyRelated{margin-top:34px}.familyRelated .relatedGrid{margin-top:14px}
/* v8 family magazine article design */
.familyArticle{position:relative}.familyHeroCard{border:0;border-radius:34px;box-shadow:0 22px 60px rgba(18,62,50,.10);background:linear-gradient(180deg,#ffffff,#fbfefd)}
.familyHeroVisual:after{content:"";position:absolute;left:-8%;right:-8%;bottom:-34px;height:72px;background:#fff;border-radius:50% 50% 0 0/60% 60% 0 0;z-index:2}.familyHeroInfo{position:relative;z-index:3;margin-top:-6px}.familyHeroInfo:before{content:"FAMILY HOTEL GUIDE";display:inline-flex;letter-spacing:.18em;font-size:10px;font-weight:900;color:#0f8f67;background:#e9f8f1;border-radius:999px;padding:7px 10px;margin-bottom:8px}
.familyHeroInfo h1{max-width:760px}.familyLead{background:#f6fbf9;border-radius:20px;padding:16px 18px;line-height:1.8;border:1px solid #e1eee8}.familyFeatures{background:#fff;border:1px solid #e7efeb;border-radius:24px;padding:10px;box-shadow:0 8px 24px rgba(16,61,49,.04)}
.familyFeature{border:1px solid rgba(20,68,55,.04);transition:transform .18s ease}.familyFeature span{filter:saturate(.9)}
.familyQuickSummary{margin:24px 0;background:linear-gradient(135deg,#163f34,#0c7b5b);color:#fff;border-radius:28px;padding:22px;box-shadow:0 16px 40px rgba(15,89,68,.18);position:relative;overflow:hidden}.familyQuickSummary:after{content:"";position:absolute;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.08);right:-70px;top:-80px}.quickSummaryHead{display:flex;align-items:center;gap:12px;position:relative;z-index:1}.quickSummaryHead>span{width:50px;height:50px;border-radius:17px;background:#fff3c9;display:grid;place-items:center;font-size:24px}.quickSummaryHead>div{display:grid;gap:2px}.quickSummaryHead small{font-size:9px;letter-spacing:.18em;opacity:.7}.quickSummaryHead b{font-size:20px}.quickSummaryGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px;position:relative;z-index:1}.quickSummaryItem{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);border-radius:18px;padding:13px;display:grid;gap:7px;min-height:96px;backdrop-filter:blur(6px)}.quickSummaryItem>span{font-size:22px}.quickSummaryItem b{font-size:13px;line-height:1.45}
.familyBooking{border:0;background:linear-gradient(135deg,#fff4c9,#eefaf5);box-shadow:0 12px 30px rgba(83,72,25,.08);padding:20px 22px}.familyBookingIcon{background:linear-gradient(135deg,#0c845f,#1ca275);box-shadow:0 8px 18px rgba(15,125,92,.22)}.familyBooking>a{background:linear-gradient(135deg,#0c845f,#08714f);box-shadow:0 8px 18px rgba(13,119,85,.20)}
.familyToc{background:linear-gradient(180deg,#fffdf7,#fff9ec);border:1px solid #efe3bd;box-shadow:0 10px 28px rgba(106,86,31,.05)}.familyTocHead>div>span{width:38px;height:38px;border-radius:13px;background:#fff0bd;display:grid;place-items:center}.familyTocGrid a{background:rgba(255,255,255,.8);border:1px solid #eee4c7;min-height:46px}.familyTocGrid a:nth-child(3n+1) span{background:#0b9168}.familyTocGrid a:nth-child(3n+2) span{background:#e6a822}.familyTocGrid a:nth-child(3n+3) span{background:#5a87ba}
.familyReadingLabel{margin:40px 0 8px;display:flex;align-items:center;justify-content:center;gap:10px;color:#5f776f;font-size:13px;letter-spacing:.06em}.familyReadingLabel span{color:#dfae2d}
.familyArticleBody{position:relative}.familyArticleBody h2{position:relative;overflow:hidden;border:1px solid #dcece5;box-shadow:0 8px 22px rgba(20,67,53,.05);padding:18px 20px;background:linear-gradient(110deg,#e8f8f2 0%,#f8fdfb 72%)}.familyArticleBody h2:nth-of-type(3n+2){background:linear-gradient(110deg,#fff6dd 0%,#fffdf7 72%);border-color:#f2e5bf}.familyArticleBody h2:nth-of-type(3n+3){background:linear-gradient(110deg,#edf6ff 0%,#fbfdff 72%);border-color:#dce9f5}.familyArticleBody h2:after{content:"";position:absolute;right:-22px;top:-34px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.55)}.familyArticleBody h3{display:inline-flex;align-items:center;gap:8px;background:#163f34;color:#fff;border-radius:999px;padding:8px 13px;font-size:16px;margin-top:26px}.familyArticleBody h3:before{content:"●";font-size:8px;color:#ffd66f}.familyArticleBody ul{background:linear-gradient(180deg,#fcfffd,#f7fbf9);box-shadow:inset 0 0 0 1px #e4eee9}.familyArticleBody li::marker{color:#0b9168}.familyArticleBody>p{max-width:780px;margin-inline:auto}.familyArticleBody p{letter-spacing:.01em}
.articlePhoto{background:#fff;padding:10px;border:1px solid #e4ece8;border-radius:28px!important;box-shadow:0 14px 36px rgba(19,65,52,.07)}.familyArticleBody .articlePhoto:empty{display:none}.articlePhoto img{border-radius:20px!important;border:0!important}.articlePhoto figcaption{display:inline-flex;margin:9px 0 2px 4px;background:#f3f8f6;border-radius:999px;padding:6px 10px!important;font-size:11px!important}
.editorPoint,.checkPoint,.memoPoint{box-shadow:0 9px 22px rgba(36,68,59,.05);border-left:0!important}.editorPoint{border:1px solid #cfe9de!important}.checkPoint{border:1px solid #f2df9c!important}.memoPoint{border:1px solid #dbe7f0!important}.familyTipIcon{box-shadow:0 6px 14px rgba(0,0,0,.06)}
.familyAffiliate{border:0!important;box-shadow:0 14px 34px rgba(56,75,64,.07)}.familyAuthor{background:linear-gradient(135deg,#f1faf6,#fff);box-shadow:0 10px 28px rgba(25,69,56,.05);border:1px solid #dfece7}.familyRelated .relatedGrid a{border-radius:20px!important;box-shadow:0 10px 24px rgba(20,67,53,.05);border:1px solid #e1ebe6!important}
.familyStickyBooking{display:none}
.familyFaq,.seoPurposeLinks{margin:34px 0}.familyFaqList{display:grid;gap:10px;margin-top:14px}.familyFaq details{border:1px solid #dfeae5;border-radius:18px;background:#fbfefd;overflow:hidden}.familyFaq summary{cursor:pointer;font-weight:850;padding:15px 18px;list-style:none}.familyFaq summary::-webkit-details-marker{display:none}.familyFaq summary:after{content:"＋";float:right;color:#0b9168;font-size:20px}.familyFaq details[open] summary:after{content:"−"}.familyFaq details p{margin:0;padding:0 18px 17px;color:#526b63;line-height:1.8}.seoPurposePills{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}.seoPurposePills a{background:#eef8f4;border:1px solid #d8ebe3;border-radius:999px;padding:9px 13px;text-decoration:none;font-weight:800;font-size:13px}.seoHubHero{background:linear-gradient(135deg,#e7f8f1,#fff8dc);border-radius:30px;padding:32px;margin:10px 0 28px;box-shadow:0 14px 36px rgba(20,67,53,.07)}.seoHubHero h1{font-size:clamp(32px,6vw,52px);line-height:1.2;margin:8px 0 12px}.seoHubHero p{max-width:760px;color:#526b63}.seoHubLinks{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.seoHubLinks a{background:#fff;border:1px solid #dce8e3;border-radius:999px;padding:8px 12px;text-decoration:none;font-weight:800;font-size:12px}.seoHubIntro{max-width:820px;margin:0 0 28px}.seoHubIntro h2{font-size:24px}.seoHubIntro p{color:#526b63}



.footer{background:#16352c;color:#fff;padding:44px 0;margin-top:60px}.footer a{color:#fff}
.filterbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}.filterbar a{padding:8px 12px;border:1px solid var(--line);border-radius:999px;text-decoration:none}.searchbar{display:flex;gap:10px;margin:0 0 22px}.searchbar input{flex:1}
.login{max-width:520px;margin:70px auto;padding:28px;border:1px solid var(--line);border-radius:22px}.input,textarea,select{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font:inherit;background:#fff}.field{margin:14px 0}.admin{max-width:1000px;margin:40px auto;padding:0 20px}.panel{border:1px solid var(--line);border-radius:20px;padding:24px;margin:20px 0}
.admin{max-width:1120px;margin:0 auto;padding:28px 20px 70px}
.adminHero{display:flex;justify-content:space-between;gap:24px;align-items:center;padding:28px;border-radius:26px;background:linear-gradient(135deg,#113e32,#168861);color:#fff;box-shadow:var(--shadow);margin:18px 0 20px}
.adminHero h1{margin:4px 0 8px;font-size:clamp(27px,5vw,42px);line-height:1.15}.adminHero p{margin:0;color:rgba(255,255,255,.82)}
.adminHero .eyebrow{color:#bde8d8}.adminHero .btn{background:#fff;color:#153b31;border-color:#fff}.adminHero .btn.sub{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.35)}
.heroActions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.inlineNativeForm{margin:0;display:inline-flex}
.statGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0}
.statCard{border:1px solid var(--line);background:#fff;border-radius:20px;padding:18px;box-shadow:0 8px 24px rgba(20,67,53,.05)}
.statCard span{display:block;color:var(--muted);font-size:12px;font-weight:800}.statCard strong{display:inline-block;font-size:30px;line-height:1.2;margin:8px 4px 2px 0}.statCard small{color:var(--muted)}
.adminGrid2{display:grid;grid-template-columns:1.15fr .85fr;gap:16px;margin:16px 0}
.smartCard{border:1px solid var(--line);background:#fff;border-radius:22px;padding:22px;box-shadow:0 8px 24px rgba(20,67,53,.05);margin:16px 0}
.smartCardHead{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}.smartCardHead h2{margin:2px 0;font-size:21px}
.statusBadge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:900;background:#eef7f3;color:var(--green2);white-space:nowrap}
.statusBadge.error{background:#fff0f0;color:#a43b3b}.statusBadge.skip{background:#fff8df;color:#8a6a00}
.timelineBox{border-radius:16px;background:var(--soft);padding:15px;font-size:14px}
.quickGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.quickBtn{border:1px solid var(--line);background:#fbfdfc;border-radius:16px;padding:16px;text-align:left;color:var(--ink);cursor:pointer;font-size:22px}.quickBtn:hover{background:var(--soft)}.quickBtn b,.quickBtn span{display:block}.quickBtn b{font-size:14px;margin-top:5px}.quickBtn span{font-size:11px;color:var(--muted);margin-top:2px}
.miniActions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}.miniActions .btn{padding:10px 14px;font-size:13px}
.activityList{display:grid;gap:8px}.activityItem{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;border-bottom:1px solid var(--soft);padding:10px 0}.activityDot{width:10px;height:10px;border-radius:50%;background:#168861}.activityDot.error{background:#c94a4a}.activityDot.skip{background:#c59a19}.activityTitle{font-weight:850;font-size:14px}.activityMeta{font-size:11px;color:var(--muted)}.activityState{font-size:11px;font-weight:850}
.adminSection{scroll-margin-top:100px}.sectionTitleRow{display:flex;align-items:center;justify-content:space-between;gap:12px}.sectionTitleRow h2{margin:0}.sectionHint{font-size:12px;color:var(--muted)}
details.adminFold{border:1px solid var(--line);border-radius:22px;background:#fff;margin:16px 0;box-shadow:0 8px 24px rgba(20,67,53,.04);overflow:hidden}
details.adminFold>summary{list-style:none;cursor:pointer;padding:19px 22px;font-weight:900;display:flex;justify-content:space-between;align-items:center;gap:14px}details.adminFold>summary::-webkit-details-marker{display:none}
details.adminFold>summary:after{content:"＋";font-size:22px;color:var(--green)}details.adminFold[open]>summary:after{content:"−"}details.adminFold>.foldBody{border-top:1px solid var(--soft);padding:4px 22px 22px}
.smartNotice{padding:12px 14px;border:1px solid #cfe4db;background:#f4fbf8;border-radius:14px;font-size:13px}
.githubUploadBox{border:1px dashed #b8d7ca;background:#fbfefd;border-radius:18px;padding:18px}
.filePickerLabel{position:relative;display:flex;align-items:center;gap:12px;width:100%;min-height:88px;padding:16px 18px;border:1px solid var(--line);border-radius:16px;background:#fff;cursor:pointer;box-sizing:border-box;-webkit-tap-highlight-color:rgba(0,0,0,.08);touch-action:manipulation}
.filePickerLabel:active{transform:scale(.995);background:#f7fbf9}
.filePickerLabel input[type="file"]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:5}
.filePickerIcon{font-size:28px;flex:0 0 auto}
.filePickerText{display:grid;gap:3px;min-width:0}
.filePickerText b{font-size:16px}
.filePickerText small{font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}

.githubUploadMeta{display:flex;gap:16px;flex-wrap:wrap;margin:10px 0;font-size:12px;color:var(--muted)}
.progressTrack{height:9px;background:#e9f1ed;border-radius:999px;overflow:hidden;margin-top:12px}
.progressBar{height:100%;width:0;background:#168861;transition:width .25s ease}
.contentRow{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:16px 0;border-bottom:1px solid var(--soft)}
.contentRow:last-child{border-bottom:0}.contentMain{min-width:0}.contentTitle{font-weight:900;font-size:15px;line-height:1.5}
.contentMeta{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:7px;font-size:11px;color:var(--muted)}
.miniBadge{display:inline-flex;padding:4px 8px;border-radius:999px;background:#f1f4f3;font-weight:800}
.miniBadge.ok{background:#eaf7f1;color:#16714f}.miniBadge.affiliate{background:#fff5df;color:#8a6200}
.contentActions{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;position:relative;z-index:20}.contentActions .btn{padding:10px 14px;font-size:13px;min-height:44px;touch-action:manipulation;position:relative;z-index:21}.dangerBtn{background:#fff1f1!important;color:#a52a2a!important;border-color:#efcaca!important}.nativeDeleteForm{margin:0;display:inline-flex}.nativeDeleteForm .dangerBtn{min-height:44px}
.errorNotice{border-color:#efd0d0;background:#fff7f7}
.nativeHotelSearchForm{margin:0}.nativeHotelResults{display:grid;gap:12px;margin-top:14px}.nativeHotelCard{display:grid;grid-template-columns:86px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:18px;background:#fff}.nativeHotelCard img{width:86px;height:72px;object-fit:cover;border-radius:12px}.nativeHotelInfo{display:grid;gap:4px;min-width:0}.nativeHotelInfo b{font-size:14px;line-height:1.4}.nativeHotelInfo span,.nativeHotelInfo small{font-size:11px;color:var(--muted)}.selectedHotelBox{display:grid;gap:10px;margin-top:16px;padding:16px;border:1px solid #b9d9ca;border-radius:18px;background:#f4fbf8}.selectedHotelHead{font-size:11px;color:var(--muted);font-weight:800}.selectedHotelBox>img{width:100%;max-height:260px;object-fit:cover;border-radius:14px}.selectedHotelBox form{margin:0}.selectedHotelBox .btn{width:100%}



.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.small{font-size:13px;color:var(--muted)}.status{padding:10px 14px;border-radius:10px;background:var(--soft);margin:12px 0}.preview{margin-top:10px;border:1px dashed var(--line);border-radius:14px;min-height:90px;display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--muted)}.preview img{width:100%;max-height:260px;object-fit:cover}
.notice{padding:14px 16px;border-radius:12px;background:#fff8d8;border:1px solid #f2e29d}
.rakutenResultCard{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:14px;align-items:center;padding:16px 0;border-bottom:1px solid var(--line)}
.rakutenResultImg{width:96px;height:72px;object-fit:cover;border-radius:12px}
.rakutenResultInfo{min-width:0}.rakutenHotelName{display:block;font-size:17px;line-height:1.5;word-break:normal;overflow-wrap:anywhere}
.affiliateTop{background:linear-gradient(135deg,#fff8ef,#fbfffd);border-width:2px}.affiliateTop b{display:block;font-size:20px;margin:4px 0 8px}
.affiliateTop a{font-size:16px;padding:13px 18px}
.authorBox{margin-top:30px;padding:20px;border-radius:18px;background:#f5faf8;border:1px solid var(--line)}
.authorBox p{margin:8px 0;color:var(--muted);font-size:14px}.authorBox a{font-weight:800;color:var(--green2)}
.relatedBox{margin-top:32px}.relatedGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.relatedGrid a{display:block;text-decoration:none;border:1px solid var(--line);border-radius:16px;padding:16px;background:#fff}
.relatedGrid b,.relatedGrid span{display:block}.relatedGrid span{margin-top:6px;color:var(--muted);font-size:12px}
.articleBody{font-size:17px;line-height:2;color:#21372f}.articleBody h2{margin-top:44px;padding:14px 0 10px;border-bottom:2px solid #dcece5;font-size:26px;line-height:1.4}.articleBody h3{margin-top:30px;font-size:20px;line-height:1.5}.articleBody p{margin:16px 0}.articleBody ul{padding-left:1.3em}.articleBody li{margin:8px 0}.editorPoint,.checkPoint,.memoPoint{display:grid;gap:5px;margin:22px 0;padding:16px 18px;border-radius:16px}.editorPoint{background:#eff9f5;border-left:5px solid #168861}.checkPoint{background:#fff9e9;border-left:5px solid #d8a91f}.memoPoint{background:#f4f7fb;border-left:5px solid #6d7f9e}
.articlePhoto{margin:22px 0 26px}
.articlePhoto img{display:block;width:auto;max-width:100%;height:auto;object-fit:contain;margin:0 auto;border-radius:18px;border:1px solid var(--line);background:#f5f7f6;min-height:120px}
.articlePhoto figcaption{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.5}
.editorPoint b,.checkPoint b,.memoPoint b{font-size:13px}.editorPoint span,.checkPoint span,.memoPoint span{font-size:15px;line-height:1.7}

@media(max-width:800px){.nav{display:none}.menuBtn{display:block}.familyArticle{padding:18px 14px 44px}.familyHeroVisual{min-height:250px}.familyHeroVisual>img{min-height:250px;max-height:330px}.familyHeroCopy{left:18px;bottom:20px}.familyHeroCopy span{font-size:13px}.familyHeroCopy b{font-size:19px;max-width:240px}.familyBubble{right:14px;top:14px;font-size:11px;padding:11px 13px}.familyHeroInfo{padding:20px 18px 22px}.familyHeroInfo h1{font-size:30px}.familyLead{font-size:16px}.familyFeatures{grid-template-columns:repeat(3,1fr)}.familyFeature{min-height:82px}.familyBooking{grid-template-columns:auto 1fr}.familyBooking>a{grid-column:1/-1;text-align:center}.familyTocGrid{grid-template-columns:1fr}.familyTocHead small{display:none}.familyArticleBody{font-size:16px}.familyArticleBody h2{font-size:22px;margin-top:36px;padding:14px}.familyArticleBody h2:before{width:34px;height:34px}.familyAuthor{display:block}.familyAuthorIcon{margin-bottom:10px}.quickSummaryGrid{grid-template-columns:1fr}.quickSummaryItem{grid-template-columns:auto 1fr;align-items:center;min-height:auto}.quickSummaryItem>span{font-size:20px}.familyHeroVisual:after{bottom:-24px;height:50px}.familyHeroInfo h1{font-size:29px}.familyFeatures{gap:7px;padding:8px}.familyFeature{border-radius:18px;min-height:74px}.familyFeature span{font-size:22px}.familyFeature b{font-size:11px}.familyToc{padding:16px}.familyArticleBody h2{border-radius:18px;padding:14px 13px;gap:10px}.articlePhoto{padding:7px;border-radius:22px!important}.articlePhoto img{border-radius:17px!important}.familyStickyBooking{display:flex;position:fixed;left:12px;right:12px;bottom:12px;z-index:70;background:rgba(22,53,44,.96);color:#fff;border-radius:20px;padding:10px 10px 10px 15px;align-items:center;justify-content:space-between;gap:10px;box-shadow:0 14px 34px rgba(0,0,0,.22);backdrop-filter:blur(12px)}.familyStickyBooking>div{display:grid}.familyStickyBooking small{font-size:9px;opacity:.65}.familyStickyBooking b{font-size:14px}.familyStickyBooking>a{background:#fff4bf;color:#16352c;text-decoration:none;font-weight:900;border-radius:14px;padding:11px 14px;font-size:13px}.familyArticle{padding-bottom:110px}.grid{grid-template-columns:1fr}.areaGrid{grid-template-columns:repeat(2,1fr)}.hero{padding:48px 0}.heroGrid{grid-template-columns:1fr}.heroPanel{display:none}.section{padding:46px 0}.row{grid-template-columns:1fr}.sectionHead{align-items:start}.brand{font-size:20px}.searchbar{display:grid;grid-template-columns:1fr auto}.rakutenResultCard{grid-template-columns:82px minmax(0,1fr);align-items:start}.rakutenResultImg{width:82px;height:68px}.rakutenResultCard .rakutenUseBtn{grid-column:1/-1;width:100%;margin-top:2px}.rakutenHotelName{font-size:16px}.admin{padding:0 14px}.panel{padding:18px}.affiliateTop a{display:block;text-align:center;margin-right:0}.adminHero{display:block;padding:22px}.heroActions{justify-content:flex-start;margin-top:16px}.statGrid{grid-template-columns:1fr 1fr}.adminGrid2{grid-template-columns:1fr}.quickGrid{grid-template-columns:1fr 1fr}.smartCard{padding:18px}.activityItem{grid-template-columns:auto 1fr}.activityState{grid-column:2}.admin{padding:14px 12px 60px}}
</style>
</head><body>
<header class="header"><div class="wrap headerin">
<a class="brand" href="/">👨‍👩‍👧‍👦 九州ファミリー旅ナビ</a>
<nav class="nav"><a href="/">ホーム</a><a href="/articles.html">記事一覧</a><a href="/#areas">エリア</a><a href="/admin.html">管理</a></nav>
<button class="menuBtn" id="menuBtn" aria-label="メニュー" aria-expanded="false">☰</button>
</div></header>
<nav class="mobileNav" id="mobileNav"><a href="/">ホーム</a><a href="/articles.html">記事一覧</a><a href="/#areas">エリアから探す</a><a href="/admin.html">管理画面</a></nav>
${body}
<footer class="footer"><div class="wrap"><b>九州ファミリー旅ナビ</b><div>子連れ九州旅行の情報メディア</div><div style="margin-top:18px"><a href="/articles.html">記事一覧</a> ・ <a href="/admin.html">管理画面</a></div><div style="margin-top:18px">© 2026 九州ファミリー旅ナビ</div></div></footer>
<script>
(function(){
  var b=document.getElementById("menuBtn"),n=document.getElementById("mobileNav");
  if(b&&n){b.addEventListener("click",function(){var open=n.classList.toggle("open");b.setAttribute("aria-expanded",String(open));b.textContent=open?"✕":"☰";});}
})();
</script>
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

async function homePage(env, url) {
  const featured = await listArticles(env.DB, { featured: true, published: true });
  const cards = featured.slice(0,6).map(articleCard).join("");
  const areas = Object.keys(AREA_LABELS).map(k =>
    `<a class="area" href="/articles.html?area=${encodeURIComponent(k)}"><div class="e">${AREA_EMOJI[k]}</div><b>${AREA_LABELS[k]}</b><div class="small">子連れスポットを探す</div></a>`
  ).join("");
  const body = `<section class="hero"><div class="wrap heroGrid"><div>
    <div class="eyebrow">九州の家族旅行を、もっとラクに。もっと楽しく。</div>
    <h1>子どもと一緒に<br><span>九州を遊びつくそう。</span></h1>
    <p class="lead">ホテル・観光スポット・食べ歩き・雨の日プランまで。パパママ目線で、子連れ旅行に本当に役立つ情報をまとめます。</p>
    <div class="btns"><a class="btn" href="/articles.html">おすすめ記事を見る</a><a class="btn sub" href="#areas">エリアから探す</a></div>
    <div class="chips"><span class="chip">🍼 赤ちゃん連れ</span><span class="chip">🛏️ 子連れホテル</span><span class="chip">☔ 雨の日OK</span></div>
  </div><aside class="heroPanel"><div class="bigEmoji">🗺️</div><h3>九州7県を家族目線で</h3><p>年齢・雨の日・ホテル・モデルコースから、家族に合う旅先を探せます。</p></aside></div></section>
  <section class="section"><div class="wrap"><div class="sectionHead"><div><div class="eyebrow">FEATURED</div><h2>おすすめ記事</h2></div><a class="more" href="/articles.html">すべて見る →</a></div><div class="grid">${cards || "<p>公開記事はまだありません。</p>"}</div></div></section>
  <section class="section soft" id="areas"><div class="wrap"><div class="eyebrow">AREA</div><h2>エリアから探す</h2><div class="areaGrid">${areas}</div></div></section>`;
  const canonical = url.origin + "/";
  const head = `<meta name="description" content="九州の子連れ旅行に役立つホテル、観光、グルメ、モデルコース情報。">
<link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="九州ファミリー旅ナビ"><meta property="og:description" content="九州の子連れ旅行に役立つホテル、観光、グルメ、モデルコース情報。"><meta property="og:url" content="${esc(canonical)}"><meta name="twitter:card" content="summary_large_image">`;
  return html(layout("九州ファミリー旅ナビ", body, head));
}


const SEO_THEME_CONFIG = {
  family:{label:"子連れホテル",short:"子連れ",re:/子連れ|家族旅行|ファミリー|家族目線/,description:"子ども連れの九州旅行で選びやすいホテル記事をまとめています。"},
  baby:{label:"赤ちゃん連れホテル",short:"赤ちゃん",re:/赤ちゃん|ベビー|添い寝|離乳食|ベビーカー|0〜2歳|0-2歳/,description:"赤ちゃん連れで確認したい客室・お風呂・食事・添い寝条件を意識したホテル記事です。"},
  pool:{label:"プール付き・水遊びホテル",short:"プール",re:/プール|アクア|水遊び|ウォーター|スライダー/,description:"子どもとプールや水遊びを楽しみたい家族向けのホテル記事をまとめています。"},
  onsen:{label:"温泉・大浴場のあるホテル",short:"温泉",re:/温泉|大浴場|露天|お風呂|浴場|スパ/,description:"家族旅行で温泉・大浴場も楽しみたい人向けのホテル記事をまとめています。"},
  breakfast:{label:"朝食・食事を楽しめるホテル",short:"朝食・食事",re:/朝食|夕食|食事|ビュッフェ|バイキング|レストラン/,description:"子どもと食事を楽しみやすいホテル選びに役立つ記事をまとめています。"}
};

function extractHotelNameFromArticle(a) {
  const tag0 = Array.isArray(a?.tags) ? String(a.tags[0] || "").trim() : "";
  if (tag0 && !/子連れ|家族旅行|九州旅行/.test(tag0)) return tag0;
  const title = String(a?.title || "");
  const separators = ["を子連れ","は家族旅行","は子連れ","の子連れ","を選ぶ前に","｜","？","?"];
  let best = title;
  for (const sep of separators) {
    const i = title.indexOf(sep);
    if (i > 0 && i < best.length) best = title.slice(0,i);
  }
  return best.trim() || title;
}

function extractMarkdownValue(content, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = String(content || "").match(new RegExp("^[-・]?\\s*"+escaped+"[：:]\\s*(.+)$","m"));
  return m ? m[1].trim() : "";
}

function extractArticleImages(a, content) {
  const urls = [];
  if (a?.coverImage) urls.push(a.coverImage);
  for (const m of String(content || "").matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g)) urls.push(m[1]);
  return [...new Set(urls)].slice(0,30);
}

function seoThemesForText(text) {
  const s = String(text || "");
  return Object.entries(SEO_THEME_CONFIG).filter(([,cfg]) => cfg.re.test(s)).map(([slug]) => slug);
}

function buildArticleSeoTitle(a, area, contentText) {
  const name = extractHotelNameFromArticle(a);
  const themes = seoThemesForText(contentText);
  const priority = ["baby","pool","onsen","breakfast","family"];
  const labels = priority.filter(x => themes.includes(x)).map(x => SEO_THEME_CONFIG[x].short);
  const intent = labels.slice(0,2).join("・") || "子連れ";
  let title = `${name}は子連れにおすすめ？${intent}を家族目線で解説`;
  if (title.length > 58) title = `${name}の子連れ宿泊ガイド｜${intent}`;
  return title + "｜九州ファミリー旅ナビ";
}

function buildArticleSeoDescription(a, area, contentText) {
  const name = extractHotelNameFromArticle(a);
  const labels = seoThemesForText(contentText).slice(0,4).map(x => SEO_THEME_CONFIG[x].short);
  const featureText = labels.length ? labels.join("・") : "客室・料金・口コミ・アクセス";
  return `${name}を子連れ・家族旅行目線でチェック。${featureText}、写真、料金、口コミ、アクセスなど予約前に確認したいポイントをわかりやすく紹介します。`;
}

function buildArticleFaq(a, area, contentText) {
  const name = extractHotelNameFromArticle(a);
  const text = String(contentText || "");
  const faq = [
    {q:`${name}は子連れ旅行で選びやすい？`,a:`${name}を家族旅行で選ぶときは、客室の寝具、食事条件、館内移動、料金総額をセットで確認するのがおすすめです。この記事では子どもの年齢を意識して判断材料を整理しています。`},
    {q:`${name}の客室は子ども連れで何を確認すればいい？`,a:`定員・ベッドや布団の数・添い寝条件・禁煙喫煙・バスとトイレの仕様を確認すると安心です。赤ちゃん連れなら寝かしつけや荷物を広げるスペースもチェックしたいポイントです。`},
    {q:`${name}を予約するとき料金は何を比べればいい？`,a:`大人だけの表示額ではなく、子ども料金、食事、寝具、利用したい施設を含めた家族全員の総額で比較するのがおすすめです。料金・空室・プラン条件は予約ページの最新情報を確認してください。`}
  ];
  if (/プール|アクア|水遊び|ウォーター/.test(text)) {
    faq.push({q:`${name}でプールや水遊びを楽しむときの注意点は？`,a:`営業期間、利用時間、年齢制限、水遊び用パンツ、浮き輪などのルールを事前に確認してください。子どもの昼寝や食事時間も含めてホテルで遊ぶ時間を確保すると動きやすくなります。`});
  } else if (/温泉|大浴場|露天|浴場/.test(text)) {
    faq.push({q:`${name}の温泉・大浴場を子どもと利用するときは？`,a:`利用時間や年齢条件を確認し、子どもの疲れ具合に応じて客室のお風呂と使い分けると安心です。観光を詰め込みすぎず入浴時間に余裕を持たせるのがおすすめです。`});
  } else if (/朝食|夕食|食事|ビュッフェ|バイキング/.test(text)) {
    faq.push({q:`${name}の食事は子ども連れで何を確認すればいい？`,a:`提供形式、食事時間、子ども料金、子どもが食べられそうな料理、会場までの移動を確認すると選びやすくなります。内容はプランや時期によって変わるため予約ページも確認してください。`});
  }
  return faq.slice(0,5);
}

function hotelSchemaFromArticle(a, canonical, area, contentText, images) {
  const name = extractHotelNameFromArticle(a);
  const address = extractMarkdownValue(a.content,"所在地");
  const priceText = extractMarkdownValue(a.content,"最安料金目安");
  const ratingText = extractMarkdownValue(a.content,"口コミ評価") || extractMarkdownValue(a.content,"評価");
  const reviewsText = extractMarkdownValue(a.content,"口コミ");
  const ratingMatch = ratingText.match(/([0-5](?:\.\d+)?)/);
  const reviewMatch = reviewsText.replace(/,/g,"").match(/(\d+)/);
  const amenities = [];
  [[/プール|アクア|水遊び/,"プール"],[/温泉|大浴場|露天|浴場/,"温泉・大浴場"],[/朝食|ビュッフェ|バイキング/,"朝食"],[/駐車場|駐車|パーキング/,"駐車場"],[/ベビー|赤ちゃん|添い寝/,"子連れ・ベビー向け情報"]]
    .forEach(([re,label]) => { if (re.test(contentText)) amenities.push({"@type":"LocationFeatureSpecification","name":label,"value":true}); });
  const schema = {
    "@type":"Hotel","@id":canonical+"#hotel","name":name,"url":canonical,
    "description":buildArticleSeoDescription(a,area,contentText),
    "image":images.length ? images : undefined,
    "address":address ? {"@type":"PostalAddress","streetAddress":address,"addressRegion":area,"addressCountry":"JP"} : undefined,
    "priceRange":priceText || undefined,
    "amenityFeature":amenities.length ? amenities : undefined
  };
  if (ratingMatch) schema.aggregateRating = {"@type":"AggregateRating","ratingValue":Number(ratingMatch[1]),"bestRating":5,"worstRating":1,"reviewCount":reviewMatch ? Number(reviewMatch[1]) : undefined};
  return schema;
}

function seoHubUrl(area, theme) {
  return `/guide/${encodeURIComponent(area)}/${encodeURIComponent(theme)}`;
}

function articleMatchesTheme(a, theme) {
  const cfg = SEO_THEME_CONFIG[theme];
  if (!cfg) return false;
  return cfg.re.test([a.title,a.excerpt,a.content,...(a.tags || [])].join(" "));
}

async function seoGuidePage(env, url) {
  const m = url.pathname.match(/^\/guide\/([^/]+)\/([^/]+)$/);
  if (!m) return html("ページが見つかりません",{status:404});
  const areaKey = decodeURIComponent(m[1]);
  const theme = decodeURIComponent(m[2]);
  const cfg = SEO_THEME_CONFIG[theme];
  const areaLabel = AREA_LABELS[areaKey];
  if (!cfg || !areaLabel) return html("ページが見つかりません",{status:404});

  const all = await listArticles(env.DB,{area:areaKey,published:true});
  const rows = all.filter(a => articleMatchesTheme(a,theme));
  const title = `${areaLabel}の${cfg.label}おすすめ・選び方｜九州ファミリー旅ナビ`;
  const desc = `${areaLabel}で${cfg.label}を探している家族向けに、客室・食事・写真・料金・口コミなどを確認できる記事をまとめました。${cfg.description}`;
  const canonical = url.origin + seoHubUrl(areaKey,theme);

  const body = `<main class="section seoHub"><div class="wrap">
    <nav class="articleBreadcrumb"><a href="/">⌂ ホーム</a><span>›</span><a href="/articles.html?area=${encodeURIComponent(areaKey)}">${esc(areaLabel)}</a><span>›</span><span>${esc(cfg.label)}</span></nav>
    <section class="seoHubHero"><div class="eyebrow">FAMILY TRAVEL GUIDE</div><h1>${esc(areaLabel)}の${esc(cfg.label)}</h1><p>${esc(desc)}</p>
      <div class="seoHubLinks">${Object.entries(SEO_THEME_CONFIG).map(([slug,x]) => `<a href="${seoHubUrl(areaKey,slug)}">${esc(x.short)}</a>`).join("")}</div>
    </section>
    <section class="seoHubIntro"><h2>家族旅行で失敗しにくい選び方</h2><p>子連れ旅行では、ホテルの豪華さだけでなく、子どもの年齢、寝具、食事時間、館内移動、家族全員の総額まで合わせて考えると選びやすくなります。気になるホテルの記事を開いて、写真と実用ポイントを比較してみてください。</p></section>
    <div class="grid">${rows.map(articleCard).join("") || "<p>現在、この条件の記事を準備中です。</p>"}</div>
  </div></main>`;

  const itemList = {"@type":"ItemList","name":`${areaLabel}の${cfg.label}`,"itemListElement":rows.map((a,i)=>({"@type":"ListItem","position":i+1,"name":a.title,"url":url.origin+"/article.html?id="+encodeURIComponent(a.id)}))};
  const breadcrumb = {"@type":"BreadcrumbList","itemListElement":[
    {"@type":"ListItem","position":1,"name":"ホーム","item":url.origin+"/"},
    {"@type":"ListItem","position":2,"name":areaLabel,"item":url.origin+"/articles.html?area="+encodeURIComponent(areaKey)},
    {"@type":"ListItem","position":3,"name":cfg.label,"item":canonical}
  ]};
  const head = `<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(canonical)}"><meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}"><script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@graph":[itemList,breadcrumb]})}</script>`;
  return html(layout(title,body,head));
}

async function articlesPage(env, url) {
  const area = url.searchParams.get("area") || "";
  const category = url.searchParams.get("category") || "";
  const q = url.searchParams.get("q") || "";
  const rows = await listArticles(env.DB, { area: area || undefined, category: category || undefined, q: q || undefined, published: true });
  const areaFilters = ['<a href="/articles.html">すべて</a>'].concat(Object.keys(AREA_LABELS).map(k =>
    `<a href="/articles.html?area=${k}">${AREA_LABELS[k]}</a>`
  )).join("");
  const body = `<main class="section"><div class="wrap"><div class="eyebrow">ARTICLES</div><h2>記事一覧</h2>
  <form class="searchbar" method="get" action="/articles.html"><input class="input" type="search" name="q" value="${esc(q)}" placeholder="例：別府、雨の日、赤ちゃん"><button class="btn" type="submit">検索</button></form>
  <div class="filterbar">${areaFilters}</div>
  ${q ? `<p class="small">「${esc(q)}」の検索結果：${rows.length}件</p>` : ""}
  <div class="grid">${rows.map(articleCard).join("") || "<p>該当する記事がありません。</p>"}</div>
  </div></main>`;
  const canonical = url.origin + "/articles.html";
  return html(layout("記事一覧｜九州ファミリー旅ナビ", body,
    `<meta name="description" content="九州ファミリー旅ナビの記事一覧。子連れホテル、観光、グルメ、モデルコースを紹介。"><link rel="canonical" href="${esc(canonical)}"><meta name="robots" content="index,follow">`));
}

async function articlePage(env, url) {
  const id = url.searchParams.get("id");
  if (!id) return html("記事IDがありません", { status:400 });
  const rows = await listArticles(env.DB, { id, published:true });
  const a = rows[0];
  if (!a) return html("記事が見つかりません", { status:404 });

  const area = AREA_LABELS[a.area] || a.area;
  const cat = CATEGORY_LABELS[a.category] || a.category;
  const isHotel = a.category === "hotel" || /ホテル|宿|旅館/.test(a.title || "");
  const readerContent = cleanReaderFacingArticle(a.content);
  const contentText = [a.title, a.excerpt, readerContent, ...(a.tags || [])].join(" ");
  const seoTitle = buildArticleSeoTitle(a, area, contentText);
  const seoDescription = buildArticleSeoDescription(a, area, contentText);
  const seoThemes = seoThemesForText(contentText);
  const faqItems = buildArticleFaq(a, area, contentText);
  const visual = a.coverImage
    ? `<img src="${esc(a.coverImage)}" alt="${esc(a.coverAlt || a.title)}" loading="eager">`
    : `<div class="familyHeroEmoji">${esc(a.icon || "🏨")}</div>`;

  const featureDefs = [
    [/子連れ|ファミリー|家族|ベビー|赤ちゃん/, "👶", "子連れ向き", "mint"],
    [/温泉|大浴場|露天|湯|スパ/, "♨️", "温泉・お風呂", "peach"],
    [/プール|アクア|水遊び|ウォーター/, "🏊", "プール", "blue"],
    [/朝食|バイキング|ビュッフェ|食事/, "🍴", "食事", "yellow"],
    [/駐車|パーキング/, "🅿️", "駐車場", "sky"],
    [/ベビーカー|ベビーベッド|添い寝|離乳食/, "🍼", "ベビー対応", "pink"]
  ];
  const features = featureDefs.filter(([re]) => re.test(contentText)).slice(0,6);
  if (!features.length) features.push([/.*/, "👨‍👩‍👧‍👦", "家族旅行", "mint"]);
  const featureHtml = features.map(x => `<div class="familyFeature ${x[3]}"><span>${x[1]}</span><b>${x[2]}</b></div>`).join("");

  const toc = articleToc(readerContent);
  const tocHtml = toc.length ? `<section class="familyToc"><div class="familyTocHead"><div><span>📖</span><b>この記事の目次</b></div><small>気になるところから読めます</small></div><div class="familyTocGrid">${toc.map((t,i)=>`<a href="#section-${i+1}"><span>${i+1}</span>${esc(t)}</a>`).join("")}</div></section>` : "";
  const summaryItems = toc.slice(0,3);
  const summaryHtml = summaryItems.length ? `<section class="familyQuickSummary"><div class="quickSummaryHead"><span>👨‍👩‍👧‍👦</span><div><small>FAMILY TRIP GUIDE</small><b>この記事でわかること</b></div></div><div class="quickSummaryGrid">${summaryItems.map((t,i)=>`<div class="quickSummaryItem"><span>${["🛏️","🍽️","✨"][i] || "✓"}</span><b>${esc(t)}</b></div>`).join("")}</div></section>` : "";

  const affiliateLinks = [
    a.affiliate.rakuten ? `<a rel="sponsored noopener" target="_blank" href="${esc(a.affiliate.rakuten)}">楽天トラベル</a>` : "",
    a.affiliate.jalan ? `<a rel="sponsored noopener" target="_blank" href="${esc(a.affiliate.jalan)}">じゃらん</a>` : "",
    a.affiliate.yahoo ? `<a rel="sponsored noopener" target="_blank" href="${esc(a.affiliate.yahoo)}">Yahoo!トラベル</a>` : ""
  ].join("");

  const tags = (a.tags || []).slice(0,4).map(t => `<span class="badge">${esc(t)}</span>`).join("");
  const relatedAll = await listArticles(env.DB, { area:a.area, published:true });
  const related = relatedAll.filter(x => x.id !== a.id).slice(0,3);
  const relatedHtml = related.length ? `<section class="relatedBox familyRelated"><div class="familySectionTitle"><span>👑</span><h2>${esc(area)}の関連記事</h2></div><div class="relatedGrid">${related.map(x => `<a href="/article.html?id=${encodeURIComponent(x.id)}"><b>${esc(x.title)}</b><span>${esc(x.excerpt || "")}</span></a>`).join("")}</div></section>` : "";
  const purposeLinksHtml = seoThemes.length ? `<section class="seoPurposeLinks"><div class="familySectionTitle"><span>🔎</span><h2>${esc(area)}を目的別に探す</h2></div><div class="seoPurposePills">${seoThemes.slice(0,5).map(theme => `<a href="${seoHubUrl(a.area,theme)}">${esc(area)}の${esc(SEO_THEME_CONFIG[theme].label)}</a>`).join("")}</div></section>` : "";
  const faqHtml = faqItems.length ? `<section class="familyFaq"><div class="familySectionTitle"><span>❓</span><h2>${esc(extractHotelNameFromArticle(a))}のよくある質問</h2></div><div class="familyFaqList">${faqItems.map((x,i)=>`<details ${i===0 ? "open" : ""}><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join("")}</div></section>` : "";

  const authorBox = `<section class="authorBox familyAuthor"><div class="familyAuthorIcon">👨‍👩‍👧‍👦</div><div><b>九州ファミリー旅ナビ編集部</b><p>子連れ旅行で役立つ情報を、家族目線でわかりやすく整理しています。</p><a href="/editorial-policy.html">編集方針・情報源について</a></div></section>`;

  const topRakutenCta = a.affiliate.rakuten ? `<section class="familyBooking"><div class="familyBookingIcon">📅</div><div class="familyBookingText"><small>PR｜アフィリエイトリンクを含みます</small><b>${isHotel ? "家族に合う宿泊プランをチェック" : "最新情報をチェック"}</b><span>料金・空室・食事条件をまとめて確認できます。</span></div><a rel="sponsored noopener" target="_blank" href="${esc(a.affiliate.rakuten)}">楽天トラベルで見る →</a></section>` : "";
  const mobileStickyBooking = a.affiliate.rakuten ? `<div class="familyStickyBooking"><div><small>PR</small><b>空室・料金を確認</b></div><a rel="sponsored noopener" target="_blank" href="${esc(a.affiliate.rakuten)}">楽天トラベル</a></div>` : "";

  const body = `<main class="article familyArticle">
    <nav class="articleBreadcrumb"><a href="/">⌂ ホーム</a><span>›</span><a href="/articles.html?area=${encodeURIComponent(a.area)}">${esc(area)}</a><span>›</span><span>${esc(cat)}</span></nav>

    <section class="familyHeroCard">
      <div class="familyHeroVisual">${visual}<div class="familyHeroShade"></div><div class="familyHeroCopy"><span>家族みんなで</span><b>${isHotel ? "ゆっくり楽しめる旅のヒント" : "思い出に残る旅のヒント"}</b></div><div class="familyBubble">👨‍👩‍👧‍👦<br>家族目線で<br>わかりやすく紹介！</div></div>
      <div class="familyHeroInfo">
        <div class="badges"><span class="badge areaBadge">${esc(area)}</span><span class="badge catBadge">${esc(cat)}</span>${tags}</div>
        <p class="meta">${esc(a.date)}${a.updatedAt && a.updatedAt !== a.date ? ` ・ 更新 ${esc(a.updatedAt)}` : ""}</p>
        <h1>${esc(a.title)}</h1>
        <p class="familyLead">${esc(a.excerpt)}</p>
        <div class="familyFeatures">${featureHtml}</div>
      </div>
    </section>

    ${summaryHtml}
    ${topRakutenCta}
    ${tocHtml}

    <div class="familyReadingLabel"><span>✦</span><b>家族目線で詳しくチェック</b><span>✦</span></div>
    <article class="articleBody familyArticleBody"><p>${markdownLite(readerContent, a.id)}</p></article>
    <script>
    (() => {
      const urlSeen = new Set();
      const hashSeen = new Map();

      const figures = [...document.querySelectorAll('.familyArticleBody .articlePhoto')];

      // Fast first pass: remove URL/resize variants immediately.
      figures.forEach(figure => {
        const img = figure.querySelector('img');
        if (!img) return;
        try {
          const u = new URL(img.getAttribute('src') || img.src, location.href);
          let path = decodeURIComponent(u.pathname || '').toLowerCase()
            .replace(/(?:[_-](?:thumb|thumbnail|small|medium|large|s|m|l))(?=\.[a-z0-9]+$)/g,'')
            .replace(/(?:[_-]\d{2,4}x\d{2,4})(?=\.[a-z0-9]+$)/g,'');
          const key = u.hostname.toLowerCase() + path;
          if (urlSeen.has(key)) {
            figure.remove();
          } else {
            urlSeen.add(key);
          }
        } catch {}
      });

      // Second pass: compare actual image bytes by SHA-256.
      const fingerprint = async img => {
        const src = img.currentSrc || img.src || img.getAttribute('src');
        if (!src) return null;
        try {
          const r = await fetch('/media/image-fingerprint?src=' + encodeURIComponent(src), {
            credentials:'same-origin'
          });
          if (!r.ok) return null;
          const data = await r.json();
          return data && data.ok ? data.hash : null;
        } catch {
          return null;
        }
      };

      const runContentDedupe = async () => {
        const current = [...document.querySelectorAll('.familyArticleBody .articlePhoto')];
        for (const figure of current) {
          if (!figure.isConnected) continue;
          const img = figure.querySelector('img');
          if (!img) continue;

          // Wait for the final image URL after direct/fallback loading.
          if (!img.complete) {
            await new Promise(resolve => {
              const done = () => resolve();
              img.addEventListener('load', done, {once:true});
              img.addEventListener('error', done, {once:true});
              setTimeout(resolve, 5000);
            });
          }

          if (!figure.isConnected || !img.currentSrc && !img.src) continue;
          const hash = await fingerprint(img);
          if (!hash) continue;

          if (hashSeen.has(hash)) {
            figure.remove();
          } else {
            hashSeen.set(hash, figure);
          }
        }
      };

      runContentDedupe();
    })();
    </script>

    ${affiliateLinks ? `<section class="affiliate familyAffiliate"><div class="familySectionTitle"><span>🧳</span><h2>旅行予約をチェック</h2></div><div class="familyAffiliateButtons">${affiliateLinks}</div><div class="small">PR｜アフィリエイトリンクを含みます。料金・空室・条件はリンク先でご確認ください。</div></section>` : ""}
    ${faqHtml}
    ${purposeLinksHtml}
    ${authorBox}
    ${relatedHtml}
    ${mobileStickyBooking}
  </main>`;

  const desc = seoDescription;
  const keywordParts = [
    extractHotelNameFromArticle(a),
    `${area} 子連れ ホテル`,
    `${area} 家族旅行`,
    ...seoThemes.map(x => `${area} ${SEO_THEME_CONFIG[x].short}`),
    ...(a.tags || [])
  ].filter(Boolean);
  const keywords = [...new Set(keywordParts)].join(",");
  const canonical = url.origin + "/article.html?id=" + encodeURIComponent(a.id);
  const images = extractArticleImages(a, readerContent);
  const image = images[0] || "";

  const articleSchema = {
    "@type":"Article","@id":canonical+"#article","headline":a.title,"name":seoTitle,"description":desc,
    "datePublished":a.date || undefined,"dateModified":a.updatedAt || a.date || undefined,
    "mainEntityOfPage":{"@type":"WebPage","@id":canonical},
    "author":{"@type":"Organization","name":"九州ファミリー旅ナビ編集部","url":url.origin+"/editorial-policy.html"},
    "publisher":{"@type":"Organization","name":"九州ファミリー旅ナビ","url":url.origin+"/"},
    "image":images.length ? images : undefined,"keywords":keywords
  };
  const breadcrumbSchema = {
    "@type":"BreadcrumbList","@id":canonical+"#breadcrumb","itemListElement":[
      {"@type":"ListItem","position":1,"name":"ホーム","item":url.origin+"/"},
      {"@type":"ListItem","position":2,"name":area,"item":url.origin+"/articles.html?area="+encodeURIComponent(a.area)},
      {"@type":"ListItem","position":3,"name":a.title,"item":canonical}
    ]
  };
  const graph = [articleSchema,breadcrumbSchema];
  if (isHotel) graph.push(hotelSchemaFromArticle(a,canonical,area,contentText,images));
  if (faqItems.length) graph.push({
    "@type":"FAQPage","@id":canonical+"#faq",
    "mainEntity":faqItems.map(x=>({"@type":"Question","name":x.q,"acceptedAnswer":{"@type":"Answer","text":x.a}}))
  });
  images.slice(0,12).forEach((img,i)=>graph.push({
    "@type":"ImageObject","@id":canonical+"#image-"+(i+1),"contentUrl":img,"url":img,
    "caption":extractHotelNameFromArticle(a)+"の写真"
  }));

  const schema = {"@context":"https://schema.org","@graph":graph};
  const head = `<meta name="description" content="${esc(desc)}"><meta name="keywords" content="${esc(keywords)}">
<link rel="canonical" href="${esc(canonical)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta property="og:type" content="article"><meta property="og:title" content="${esc(seoTitle)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}">${image ? `<meta property="og:image" content="${esc(image)}">` : ""}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(seoTitle)}"><meta name="twitter:description" content="${esc(desc)}">${image ? `<meta name="twitter:image" content="${esc(image)}">` : ""}<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  return html(layout(seoTitle, body, head));
}
async function upgradePremiumArticles(request, env) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured" }, { status: 500 });
  if (!requireAuth(request, env)) return unauthorized();
  if (request.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  let updated = 0;
  const missing = [];
  const errors = [];
  for (const a of PREMIUM_ARTICLES) {
    try {
      const result = await env.DB.prepare(`UPDATE articles SET
        title=?, excerpt=?, content=?, tags=?, ageGroups=?, practical=?,
        seoMetaDescription=?, seoKeywords=?, updatedAt=?
        WHERE id=?`).bind(
          a.title, a.excerpt, a.content,
          JSON.stringify(a.tags || []), JSON.stringify(a.ageGroups || []), JSON.stringify(a.practical || []),
          a.seo?.metaDescription || "", a.seo?.keywords || "", todayJst(), a.id
        ).run();
      const changes = Number(result?.meta?.changes ?? result?.changes ?? 0);
      if (changes > 0) updated++;
      else missing.push(a.id);
    } catch (e) {
      errors.push({ id: a.id, error: String(e?.message || e) });
    }
  }
  return json({ ok: errors.length === 0, updated, total: PREMIUM_ARTICLES.length, missing, errors });
}




function editorialSeed(value = "") {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}
function chooseBySeed(items, seed, offset = 0) {
  return items[(seed + offset) % items.length];
}
function prefectureFromAddress(address = "") {
  for (const p of ["福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県"]) {
    if (address.includes(p)) return p;
  }
  return "九州";
}
function pricePerspective(n) {
  const p = Number(n || 0);
  if (!p) return "料金は日程やプランで変わるため、家族全員の総額で比較したい";
  if (p < 10000) return "比較的手を伸ばしやすい価格帯のプランが見つかる可能性がある";
  if (p < 20000) return "価格と滞在内容のバランスを見ながら選びたい";
  if (p < 35000) return "安さだけでなく食事・客室・立地まで含めて納得感を見たい";
  return "記念旅行向けの予算になることもあるため、プラン内容と総額を丁寧に比較したい";
}


function varyHotelArticleContent(markdown, seed, hotel) {
  const raw = String(markdown || "");
  const matches = [...raw.matchAll(/^##\s+(.+)$/gm)];
  if (matches.length < 3) return raw;

  const sections = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    sections.push({
      heading: matches[i][1].trim(),
      text: raw.slice(start, end).trim()
    });
  }

  const mode = Math.abs(Number(seed || 0)) % 4;
  const modeData = [
    {
      label:"安心重視",
      intro:"今回は、赤ちゃん・幼児連れで『泊まってから困らないか』を最優先に、客室・館内設備・年齢別ポイントから見ていきます。",
      order:["客室","年齢別","館内施設","食事付き","1泊2日","料金","口コミ","旅行の中","編集部","こんな家族","逆に"],
      aliases:{
        "客室・内装を写真でチェック":"子どもと泊まる客室を先に確認",
        "年齢別に見る確認ポイント":"年齢別｜ここまで見れば安心",
        "館内施設・温泉・プールを確認":"館内で無理なく楽しめる？",
        "食事付きか素泊まりか":"子連れの食事プラン、どっちが楽？"
      }
    },
    {
      label:"ホテル滞在重視",
      intro:"このホテルは『観光のために寝る宿』ではなく、館内で過ごす時間も含めて評価してみます。設備・客室・食事の順で見ていきましょう。",
      order:["館内施設","客室","食事付き","口コミ","料金","年齢別","1泊2日","旅行の中","編集部","こんな家族","逆に"],
      aliases:{
        "館内施設・温泉・プールを確認":"ホテル時間を楽しめる設備は？",
        "客室・内装を写真でチェック":"客室で過ごす時間をイメージ",
        "食事付きか素泊まりか":"ホテル滞在を左右する食事選び",
        "口コミは“点数”より“似た家族”を見る":"宿泊者の声から見えるリアル"
      }
    },
    {
      label:"旅程重視",
      intro:"子連れ旅行では、ホテル単体の良さより『その日の動線に無理がないか』が重要です。今回はアクセスと1泊2日の動き方から逆算します。",
      order:["旅行の中","1泊2日","客室","館内施設","食事付き","年齢別","料金","口コミ","編集部","こんな家族","逆に"],
      aliases:{
        "旅行の中でどう使うホテルか":"旅程のどこにこのホテルを置く？",
        "1泊2日ならこのくらいが現実的":"子どもを疲れさせにくい1泊2日モデル",
        "客室・内装を写真でチェック":"到着後すぐ休める客室か",
        "料金を見るときに一番気をつけたいこと":"旅程と予算を一緒に考える"
      }
    },
    {
      label:"比較・コスパ重視",
      intro:"候補ホテルが複数あるときに比べやすいよう、料金・口コミ・客室・設備の順で『選ぶ材料』を整理します。",
      order:["料金","口コミ","客室","食事付き","館内施設","旅行の中","年齢別","1泊2日","編集部","こんな家族","逆に"],
      aliases:{
        "料金を見るときに一番気をつけたいこと":"家族全員の総額で比べる",
        "口コミは“点数”より“似た家族”を見る":"口コミはここだけ拾えばOK",
        "客室・内装を写真でチェック":"同価格帯と比べたい客室ポイント",
        "逆に、ここは予約前に再確認":"最後に比較表へ戻る前のチェック"
      }
    }
  ][mode];

  const first = sections.shift();
  const lastIndex = sections.findIndex(s => s.heading.startsWith("最後に"));
  const last = lastIndex >= 0 ? sections.splice(lastIndex, 1)[0] : null;

  const used = new Set();
  const ordered = [];
  for (const keyword of modeData.order) {
    const idx = sections.findIndex((s, i) => !used.has(i) && s.heading.includes(keyword));
    if (idx >= 0) {
      used.add(idx);
      ordered.push(sections[idx]);
    }
  }
  sections.forEach((s, i) => {
    if (!used.has(i)) ordered.push(s);
  });

  const renameSection = section => {
    let text = section.text;
    const alias = modeData.aliases[section.heading];
    if (alias) {
      text = text.replace(/^##\s+.+$/m, "## " + alias);
    }
    return text;
  };

  const detailNote = hotel.roomImageUrl
    ? `> POINT: 客室・館内施設・食事など、写真で確認しやすいポイントもあわせて紹介します。`
    : `> MEMO: 客室タイプによって広さや設備が異なるため、予約前に部屋タイプごとの写真と定員を確認しておくと安心です。`;

  return [
    first ? first.text : "",
    `> POINT: ${modeData.intro}`,
    detailNote,
    ...ordered.map(renameSection),
    last ? last.text : ""
  ].filter(Boolean).join("\n\n");
}


function buildPhotoDrivenFamilySections({
  name,
  roomImages=[],
  mealImages=[],
  poolImages=[],
  bathImages=[],
  facilityImages=[],
  planImages=[],
  otherImages=[],
  photoGalleryBlock,
  roomScore=0,
  bathScore=0,
  breakfastScore=0,
  cleanlinessScore=0,
  special="",
  seed=0
}) {
  const sections = [];
  const childFocus = chooseBySeed([
    "赤ちゃん連れなら「寝かせる・食べさせる・お風呂」の3つがスムーズかを優先して見たいところです。",
    "幼児連れなら、館内移動を減らせるかと、夕方以降に子どもが疲れても立て直しやすいかが重要です。",
    "小学生連れなら、子ども自身が楽しみにできる設備と、家族全員が窮屈にならない客室を両方見たいところです。"
  ], seed, 1);

  if (roomImages.length) {
    const roomAngle = roomScore >= 4.5
      ? `部屋評価が★${roomScore}なら、数字の上でも客室は強みとして見やすいです。`
      : roomScore
        ? `部屋評価は★${roomScore}。写真だけでなく、寝具構成と定員まで合わせて確認したいところです。`
        : "客室写真から、家族で過ごす場面を具体的に想像してみます。";

    sections.push(`## 客室｜「広いか」より、家族が夜をどう過ごせるか

${photoGalleryBlock(roomImages, "客室・内装", "客室・内装の写真です。")}

${roomAngle}

子連れでは、チェックイン後に荷物を広げ、子どもを着替えさせ、翌日の準備まで同じ部屋で行います。そこで見たいのは、ベッドの豪華さよりも**荷物を置く場所・寝具の並び・洗面まわり・子どもを寝かせた後に大人が動ける余白**です。

${childFocus}

> CHECK: 写真と一緒に、定員・寝具・添い寝条件・禁煙喫煙・バスとトイレの仕様まで確認しておくと、到着してからの「思っていたのと違う」を減らせます。`);
  }

  if (mealImages.length) {
    const mealAngle = breakfastScore >= 4.5
      ? `朝食評価が★${breakfastScore}なら、食事を楽しみに宿を選ぶ家族にも注目しやすい数字です。`
      : breakfastScore
        ? `朝食評価は★${breakfastScore}。料理写真と合わせて、子どもが食べられそうなものがあるかを見ておきたいところです。`
        : "食事写真があるホテルでは、子どもが食べられそうなものを家族で一緒に確認しておくと安心です。";

    sections.push(`## 食事｜「豪華そう」だけでなく、子どもが食べられるか

${photoGalleryBlock(mealImages, "食事・朝食・レストラン", "食事・レストランの写真です。")}

${mealAngle}

家族旅行の食事は、料理の種類だけでなく**時間と移動のしやすさ**も大切です。観光で疲れたあとに外へ食べに出るのか、ホテル内でそのまま食べられるのかで、夕方の負担はかなり変わります。

幼児なら取り分けやすい料理、小学生なら自分で選べる楽しさ、赤ちゃん連れなら離乳食や食事時間との合わせやすさを意識してプランを見てみましょう。

> POINT: 食事付きプランは「高い・安い」だけでなく、外食への移動1回を減らせる価値まで含めて比べると、子連れでは判断しやすくなります。`);
  }

  if (poolImages.length) {
    sections.push(`## プール・水遊び｜ホテルそのものを旅行の予定にできる？

${photoGalleryBlock(poolImages, "プール・水遊び施設", "プール・水遊び施設の写真です。")}

プールがあるホテルは、観光を詰め込みすぎなくても子どもが満足しやすいのが魅力です。特に幼児〜小学生なら、チェックイン後に1時間遊ぶだけでも「ホテルに泊まること」自体が思い出になります。

写真では広さだけでなく、**浅い場所がありそうか・保護者が見守りやすそうか・休憩できそうか**も見ておきたいところです。

> CHECK: 営業期間・利用時間・年齢制限・水遊び用パンツ・浮き輪などの条件は、予約前に最新情報をご確認ください。`);
  }

  if (bathImages.length) {
    const bathAngle = bathScore >= 4.5
      ? `風呂評価が★${bathScore}なら、温泉や大浴場を楽しみにしている家族には強い材料です。`
      : bathScore
        ? `風呂評価は★${bathScore}。写真と一緒に、子どもと利用する時間帯も考えておくと安心です。`
        : "温泉・浴場の写真から、子どもと使う場面をイメージしてみます。";

    sections.push(`## お風呂・温泉｜子どもと入るなら「時間の余裕」が大事

${photoGalleryBlock(bathImages, "温泉・お風呂", "温泉・浴場の写真です。")}

${bathAngle}

赤ちゃん・幼児連れでは、温泉の良さ以上に「疲れた子どもを連れて無理なく入れるか」が大事です。観光を予定いっぱいまで入れず、夕食や就寝の前にゆっくり入浴時間を取れると家族全員が楽になります。

> POINT: 客室のお風呂と大浴場を使い分けられるように考えておくと、子どもの機嫌や眠気に合わせやすくなります。`);
  }

  if (facilityImages.length) {
    const cleanText = cleanlinessScore
      ? `清潔さ評価は★${cleanlinessScore}。館内写真と合わせて、家族で長く過ごせそうかを見ていきます。`
      : "館内写真は、ホテルでの移動量を想像する材料になります。";

    sections.push(`## 館内｜子連れは「移動しやすさ」と「休める場所」を見る

${photoGalleryBlock(facilityImages, "館内・施設", "館内・施設の写真です。")}

${cleanText}

大人だけなら気にならない館内移動も、抱っこ・ベビーカー・大きな荷物があると負担になります。ロビーから客室、食事会場、お風呂、駐車場までの動線がシンプルだと、それだけで滞在が楽になります。

雨の日や子どもが疲れた日は「外に出なくても過ごせるか」という視点も大切です。`);
  }

  if (planImages.length) {
    sections.push(`## プラン写真｜家族に必要なものが料金に含まれている？

${photoGalleryBlock(planImages, "宿泊プラン・施設", "宿泊プラン・施設の写真です。")}

プラン写真が魅力的でも、家族旅行では**食事・子ども料金・寝具・利用できる施設**がどこまで含まれているかが重要です。大人2人の最安値だけではなく、家族全員を入力した総額で比較しましょう。`);
  }

  if (otherImages.length) {
    sections.push(`## 写真でもう少し見る｜${name}で過ごすイメージ

${photoGalleryBlock(otherImages, "ホテル写真", "ホテル選びの参考になる写真です。")}

写真を家族で一緒に見て「ここで何をしたい？」と話してみると、客室・食事・お風呂・遊びのどれを優先するか決めやすくなります。`);
  }

  if (!sections.length && special) {
    sections.push(`## ${name}の特徴を家族目線で見る

施設紹介では「${String(special).slice(0,180)}」と案内されています。

子連れでは、魅力的な設備があるかどうかだけでなく、子どもの年齢と旅程に合わせて無理なく使えるかを考えて選ぶのがおすすめです。`);
  }

  return sections.join("\n\n");
}

function buildFamilyHotelArticle(hotel) {
  const name = String(hotel.hotelName || "ホテル").trim();
  const address = String(hotel.address || "").trim();
  const access = String(hotel.access || "").trim();
  const special = String(hotel.hotelSpecial || "").trim();
  const priceNum = Number(hotel.hotelMinCharge || 0);
  const ratingNum = Number(hotel.reviewAverage || 0);
  const reviewNum = Number(hotel.reviewCount || 0);
  const price = priceNum ? Number(priceNum).toLocaleString() + "円〜" : "予約ページで確認";
  const rating = ratingNum ? "★" + ratingNum.toFixed(2).replace(/0+$/,'').replace(/\\.$/,'') : "予約ページで確認";
  const reviews = reviewNum ? reviewNum.toLocaleString() + "件" : "予約ページで確認";
  const pref = prefectureFromAddress(address);
  const seed = editorialSeed(hotel.hotelNo || name);
  const checked = todayJst();
  const roomScore = Number(hotel.roomAverage || 0);
  const bathScore = Number(hotel.bathAverage || 0);
  const breakfastScore = Number(hotel.breakfastAverage || 0);
  const cleanlinessScore = Number(hotel.cleanlinessAverage || 0);
  const detailedScoreParts = [
    roomScore ? `部屋★${roomScore}` : "",
    bathScore ? `風呂★${bathScore}` : "",
    breakfastScore ? `朝食★${breakfastScore}` : "",
    cleanlinessScore ? `清潔さ★${cleanlinessScore}` : ""
  ].filter(Boolean);

  const gallery = Array.isArray(hotel.imageGallery) ? hotel.imageGallery : [];
  const fallbackImages = [
    {url:hotel.hotelImageUrl || "", category:"hotel", isThumbnail:false},
    {url:hotel.roomImageUrl || "", category:"room", isThumbnail:false},
    {url:hotel.planImageUrl || "", category:"plan", isThumbnail:false},
    {url:hotel.hotelThumbnailUrl || "", category:"hotel", isThumbnail:true},
    {url:hotel.roomThumbnailUrl || "", category:"room", isThumbnail:true},
    {url:hotel.planThumbnailUrl || "", category:"plan", isThumbnail:true}
  ].filter(x => x.url);

  const gallerySource = gallery.length ? gallery : fallbackImages;
  const byUrl = new Map();
  for (const img of gallerySource) {
    if (!img?.url) continue;
    const key = canonicalArticleImageKey(img.url);
    const prev = byUrl.get(key);
    if (!prev || (prev.isThumbnail && !img.isThumbnail)) byUrl.set(key, img);
  }
  const allImages = [...byUrl.values()];
  const originalsBy = category => allImages.filter(x => x.category === category && !x.isThumbnail);

  const looksLikeMeal = img => /breakfast|dinner|meal|food|restaurant|cuisine|buffet|朝食|夕食|食事|料理|バイキング|ビュッフェ/i.test(String(img?.url || ""));
  const looksLikePool = img => /pool|aqua|swimming|プール|水遊び/i.test(String(img?.url || ""));
  const looksLikeBath = img => /bath|onsen|spa|hotspring|露天|温泉|風呂|大浴場/i.test(String(img?.url || ""));
  const looksLikeRoom = img => /room|guestroom|bedroom|bed|客室|和室|洋室/i.test(String(img?.url || ""));

  // Room section is strict: ambiguous images do not enter it.
  const verifiedRoomImages = originalsBy("room").filter(img =>
    looksLikeRoom(img) && !looksLikeMeal(img) && !looksLikePool(img) && !looksLikeBath(img)
  );


  const roomImages = verifiedRoomImages;
  const mealImages = originalsBy("meal");
  const bathImages = originalsBy("bath");
  const poolImages = originalsBy("pool");
  const facilityImages = [...originalsBy("facility"), ...originalsBy("hotel")];
  const planImages = originalsBy("plan");
  const otherImages = originalsBy("other");

  const hasPool = /プール|アクア|ウォーター|スライダー|水着/.test(special) || poolImages.length > 0;
  const hasOnsen = /温泉|露天|大浴場|湯|スパ/.test(special) || bathImages.length > 0;
  const hasKids = /キッズ|子供|子ども|ファミリー|ベビー/.test(special);

  const usedArticleImages = new Set();
  const uniqueSectionImages = items => {
    const out = [];
    for (const img of items || []) {
      if (!img?.url) continue;
      const key = canonicalArticleImageKey(img.url);
      if (usedArticleImages.has(key)) continue;
      usedArticleImages.add(key);
      out.push(img);
    }
    return out;
  };

  const heroImages = uniqueSectionImages(facilityImages.slice(0,2));
  const articleRoomImages = uniqueSectionImages(roomImages);
  const articlePoolImages = uniqueSectionImages(poolImages);
  const articleBathImages = uniqueSectionImages(bathImages);
  const articleMealImages = uniqueSectionImages(mealImages);
  const articleFacilityImages = uniqueSectionImages(facilityImages.slice(2));
  const articlePlanImages = uniqueSectionImages(planImages);
  const articleOtherImages = uniqueSectionImages(otherImages);
  const articleAllRemainingImages = uniqueSectionImages(allImages.filter(x => !x.isThumbnail));

  const photoBlock = (url, alt, caption) => url
    ? `![${alt}](${url})\n\n`
    : "";

  const photoGalleryBlock = (items, label, caption) => {
    if (!items || !items.length) return "";
    return items.map((img,i) =>
      photoBlock(
        img.url,
        `${name}の${label}${items.length > 1 ? ` ${i+1}` : ""}`,
        `${caption}${items.length > 1 ? `（${i+1}枚目）` : ""}`
      )
    ).join("");
  };

  const photoDrivenSections = buildPhotoDrivenFamilySections({
    name,
    roomImages: articleRoomImages,
    mealImages: articleMealImages,
    poolImages: articlePoolImages,
    bathImages: articleBathImages,
    facilityImages: articleFacilityImages,
    planImages: articlePlanImages,
    otherImages: [...articleOtherImages, ...articleAllRemainingImages],
    photoGalleryBlock,
    roomScore,
    bathScore,
    breakfastScore,
    cleanlinessScore,
    special,
    seed
  });

  const seoIntentLabels = [
    articlePoolImages.length ? "プール" : "",
    articleBathImages.length ? "温泉" : "",
    articleMealImages.length ? "朝食・食事" : "",
    articleRoomImages.length ? "客室" : "",
    /赤ちゃん|ベビー|添い寝|離乳食/.test(special) ? "赤ちゃん連れ" : ""
  ].filter(Boolean);
  const primarySeoIntent = seoIntentLabels.slice(0,2).join("・") || "子連れ";
const localHints = {
    "福岡県":["市街地観光と組み合わせやすい","食事の選択肢を広げやすい","公共交通中心でも旅程を作りやすい"],
    "佐賀県":["温泉やドライブ旅と相性がいい","移動を詰め込みすぎない旅程が合いやすい","車移動の家族旅行に向きやすい"],
    "長崎県":["観光地ごとの移動時間を見込んでおきたい","坂道や移動量を考えてホテル時間を確保したい","市街地観光と宿泊の動線が重要"],
    "熊本県":["阿蘇方面か市街地かで旅程が大きく変わる","車移動なら余裕あるスケジュールが組みやすい","観光エリアとの距離を先に確認したい"],
    "大分県":["温泉目的の滞在と相性がいい","別府・由布院など滞在エリアで旅程が変わる","ホテルで過ごす時間を長めに取る選択肢もある"],
    "宮崎県":["車移動前提でゆったり組むと満足しやすい","海側・市街地・高千穂方面で動線が変わる","移動時間を短く見積もらない方が安心"],
    "鹿児島県":["市街地と指宿・霧島で旅程が大きく変わる","温泉と観光を一日に詰め込みすぎない方がいい","車・公共交通どちらでも前後の移動確認が大切"]
  };
  const localHint = chooseBySeed(localHints[pref] || ["九州旅行の動線と合わせて選びたい"], seed, 1);
  const opening = chooseBySeed([
    `ホテル選びで最後まで迷うのは、「悪くなさそう」から「ここにしよう」へ決める瞬間です。${name}も、写真や点数を見るだけでは決め切れません。`,
    `子ども連れの宿選びでは、豪華さより“家族の一日が無理なく回るか”が大事です。${name}をその目線で見ていきます。`,
    `旅先では、ホテルに着くころが家族全員いちばん疲れていることがあります。だから宿は、観光の続きではなく“立て直せる場所”として選びたいところです。`,
    `${name}を候補に入れたとき、最初に見たいのは口コミ点数より「自分たちの旅程にハマるか」です。そこを家族目線で整理します。`
  ], seed);
  const title = chooseBySeed([
    `${name}は子連れで泊まりやすい？${primarySeoIntent}・客室・食事を家族目線でチェック`,
    `${name}を家族旅行で選ぶなら｜赤ちゃん・幼児・小学生別に見るポイント`,
    `${name}の子連れ宿泊ガイド｜写真で見る客室・食事・過ごし方`,
    `${pref}で${name}に泊まるなら？家族の1泊2日をイメージして解説`
  ], seed);
  const usablePhotoCount = allImages.filter(x => !x.isThumbnail).length;
  const verdict = ratingNum >= 4.5 && reviewNum >= 100
    ? `数字だけを見るとかなり強い候補です。${rating}、口コミ${reviews}という組み合わせは、評価の高さと母数の両方を確認できます。`
    : ratingNum >= 4.2
      ? `評価は${rating}${reviewNum ? `、口コミ${reviews}` : ""}。候補から外す理由は少なく、次は立地とプラン条件を見る段階です。`
      : `数字だけで即決するタイプではありません。立地、客室、食事、家族全員の総額まで見て判断したいホテルです。`;

  const strongestScore = [
    ["客室", roomScore],
    ["お風呂", bathScore],
    ["朝食", breakfastScore],
    ["清潔さ", cleanlinessScore]
  ].filter(x => x[1] > 0).sort((a,b) => b[1] - a[1])[0];

  const familyStrengths = [
    hasPool ? "ホテル内で水遊びの予定を組みやすい" : "",
    hasOnsen ? "観光だけでなく、お風呂時間も旅の楽しみにしやすい" : "",
    articleMealImages.length ? "食事の雰囲気を写真で確認しやすい" : "",
    articleRoomImages.length ? "客室写真を見ながら寝具・過ごし方を想像しやすい" : "",
    strongestScore && strongestScore[1] >= 4.5 ? `${strongestScore[0]}の評価が比較的高い` : "",
    access ? "アクセス情報を見ながら旅程を組みやすい" : ""
  ].filter(Boolean).slice(0,4);

  const familyCautions = [
    !articleRoomImages.length ? "客室タイプごとの写真・寝具条件は予約画面でも確認したい" : "",
    !articleMealImages.length ? "食事内容はプランごとの差を予約画面で確認したい" : "",
    hasPool ? "プールの営業期間・年齢条件を確認したい" : "",
    hasOnsen ? "子どもの年齢や利用時間に合わせて入浴計画を考えたい" : "",
    "子ども料金・添い寝・食事条件を入れた家族全員の総額で比較したい"
  ].filter(Boolean).slice(0,4);

  const babyFit = chooseBySeed([
    hasOnsen
      ? "お風呂を旅程の中心に置きやすい一方、赤ちゃんの眠気に合わせて客室風呂も選べるよう準備したいタイプです。"
      : "添い寝・寝具・客室風呂の条件を先に確認しておくと選びやすいタイプです。",
    articleRoomImages.length
      ? "客室写真があるので、ベッド配置や荷物スペースを想像しながら赤ちゃん連れの動きを考えやすいです。"
      : "赤ちゃん連れでは、客室写真より先に添い寝・寝具・お風呂の条件確認を優先したいです。"
  ], seed, 1);

  const preschoolFit = chooseBySeed([
    hasPool
      ? "幼児連れなら、観光を減らしてホテルのプール時間を長めに取る組み方がしやすそうです。"
      : articleMealImages.length
        ? "幼児連れでは、夕食をホテル内で完結させるプランにすると夕方の移動を減らしやすいです。"
        : "幼児連れでは、チェックイン後に一度休める旅程にすると夕方のぐずり対策になります。",
    "3〜6歳は夕方に疲れが出やすいので、ホテル到着後すぐ次の予定を入れない組み方が向いています。"
  ], seed, 1);

  const schoolFit = chooseBySeed([
    hasPool
      ? "小学生ならプールを旅の予定として本人に選ばせると、ホテル滞在そのものを楽しみにしやすいです。"
      : "小学生なら、客室・食事・周辺観光のどれを楽しみにしたいか本人にも写真を見せて決めるのがおすすめです。",
    articleMealImages.length
      ? "小学生連れでは、食事写真を見ながら『朝食を楽しむか、早く出発するか』まで一緒に決めやすいです。"
      : "小学生なら、ホテルでの時間と翌日の観光をセットで考えると選びやすいです。"
  ], seed, 1);

  const dayOnePlan = hasPool
    ? "チェックイン後は荷物を置いて少し休憩し、その後にプール・水遊び。夕食とお風呂の前に遊びを終える流れなら、子どもも切り替えやすいです。"
    : hasOnsen
      ? "観光を少し早めに切り上げてチェックイン。客室で休憩したあと、お風呂→夕食の順にすると、子どもが疲れ切る前にホテル時間へ切り替えやすいです。"
      : "観光は夕方まで引っ張りすぎず、チェックイン後に30分ほど客室で休憩。夕食前に一度リセットする流れが家族旅行では現実的です。";

  const dayTwoPlan = articleMealImages.length
    ? "朝食を楽しむなら、出発時間を詰めすぎないのがポイント。朝食後に荷物をまとめ、午前の観光を1つに絞ると動きやすいです。"
    : "朝の支度とチェックアウトに余裕を持ち、午前の観光を1つに絞ると家族全員が疲れにくくなります。";

  const baseContent = `## 結論｜${name}は、こんな家族なら候補に入れやすい

${opening}

${verdict}

${familyStrengths.length ? `### 家族目線で見た強み\n\n${familyStrengths.map(x => `- ${x}`).join("\n")}` : ""}

${familyCautions.length ? `### 予約前に確認したいこと\n\n${familyCautions.map(x => `- ${x}`).join("\n")}` : ""}

${photoGalleryBlock(heroImages, "外観・施設", "ホテルの外観・施設写真です。")}

> POINT: ${localHint}。ホテル単体の良さだけでなく、前後の移動とホテルで過ごす時間までセットで考えると選びやすくなります。

## まず確認｜家族旅行で必要な基本情報

- エリア：${pref}
- 所在地：${address || "予約ページで確認"}
- 最安料金目安：${price}
- 楽天評価：${rating}
- 口コミ：${reviews}
${usablePhotoCount ? `- 掲載写真：${usablePhotoCount}枚` : ""}
${detailedScoreParts.length ? `- 評価内訳：${detailedScoreParts.join(" / ")}` : ""}
${hotel.checkinTime ? `- チェックイン：${hotel.checkinTime}` : ""}
${hotel.checkoutTime ? `- チェックアウト：${hotel.checkoutTime}` : ""}
- 情報確認日：${checked}

${special ? `施設紹介では「${String(special).slice(0,220)}」と案内されています。家族旅行では、この特徴を実際の旅程にどう組み込めるかまで考えて選びたいところです。` : ""}

## 年齢別｜うちの子ならどう見る？

### 0〜2歳

${babyFit}

確認したいのは、添い寝条件、寝具、客室のお風呂、離乳食や電子レンジなど「ないと困るもの」。あるか分からない設備は、予約前に確認しておくと安心です。

### 3〜6歳

${preschoolFit}

この年齢は、ホテルの設備より「夕方に無理がないか」が満足度を左右しやすいです。チェックインと夕食の間に休める余裕を作れるかを見ておきましょう。

### 小学生

${schoolFit}

本人にもホテル写真を見せて、何を楽しみにしたいか聞いておくと、親だけで決めるより家族全体の満足度を上げやすくなります。

${photoDrivenSections || `## 写真が少ないホテルほど、条件確認を丁寧に

写真だけで決めず、客室タイプ・寝具・食事条件・子ども料金を予約画面で確認して、家族に必要な条件がそろっているかを先に見ておきましょう。`}

## 到着してから寝るまでを想像してみる

子連れ旅行では、ホテルに着いた瞬間から「次に何をするか」で疲れ方が変わります。

${access ? `アクセス案内は「${access}」。この移動を前提に、ホテル到着を遅くしすぎない旅程にしておくと安心です。` : "アクセスは予約ページで確認し、ホテル到着を遅くしすぎない旅程にしておくと安心です。"}

${dayOnePlan}

> MEMO: 子ども連れでは、移動時間の長さだけでなく「車を降りる・荷物を持つ・乗り換える」といった移動回数も疲れにつながります。

## 料金｜最安値より「家族全員でいくらか」を見る

最安料金の目安は${price}です。

ただし、ホテル検索の最安値は大人2名などの条件で表示されることがあります。家族旅行では、大人・小学生・幼児を正しく入力し、**食事・寝具・添い寝・利用したい施設まで含めた総額**で比べるのが大切です。

${pricePerspective(priceNum)}

> CHECK: 「一番安いプラン」と「家族に必要な条件が全部入ったプラン」は別物です。予約直前に総額と条件をもう一度確認しましょう。

## 口コミ｜点数だけでなく、自分たちに近い家族の声を見る

楽天評価は${rating}、口コミは${reviews}です。

${strongestScore ? `${strongestScore[0]}は★${strongestScore[1]}。評価内訳がある場合は、総合点だけでなく自分たちが重視する項目を見た方が参考になります。` : ""}

口コミを読むなら、0〜2歳は添い寝・お風呂・食事、3〜6歳は夕食時間・館内移動・遊び、小学生は朝食・プール・観光への動きやすさなど、**自分の家族と条件が近い投稿**を優先して見るのがおすすめです。

## 1泊2日｜子どもを疲れさせすぎない組み方

### 1日目

${dayOnePlan}

### 2日目

${dayTwoPlan}

「最後まで遊び切る」より、「帰宅まで機嫌よく」を目標にすると、家族旅行全体の満足度は上がりやすいです。

## このホテルが合いやすい家族

${[
  hasPool ? "ホテルで遊ぶ時間も旅行の予定に入れたい家族" : "",
  hasOnsen ? "観光だけでなく、お風呂・温泉の時間も大切にしたい家族" : "",
  articleMealImages.length ? "ホテルでの食事も楽しみたい家族" : "",
  articleRoomImages.length ? "客室写真を見ながら寝具や過ごし方を比較したい家族" : "",
  `${pref}で無理のない子連れ旅程を組みたい家族`,
  "料金だけでなく口コミや条件も見て決めたい家族"
].filter(Boolean).map(x => `- ${x}`).join("\n")}

## こんな場合は、予約前にもう一度確認

- ベビーベッド・ベッドガードなど必須のベビー用品がある
- アレルギー対応や離乳食対応が必要
- 送迎・駐車場が旅程上必須
- ベッド構成や添い寝条件にこだわりがある
${hasPool ? "- プールの営業期間・年齢条件が旅行日に合うか確認したい" : ""}
${hasOnsen ? "- 子どもと利用できるお風呂の条件・時間帯を確認したい" : ""}
- キャンセル条件を柔軟にしたい

## まとめ｜「泊まりたい」より、家族が「泊まりやすいか」で決める

${name}を見るときは、ホテルの豪華さや評価点だけでなく、**子どもの年齢・到着時間・食事・お風呂・寝具・翌朝の動き**まで一続きで考えるのがおすすめです。

${hasPool ? "プールを使いたいなら、ホテル滞在時間を短くしすぎないこと。" : ""}
${hasOnsen ? "温泉を楽しみたいなら、夕方の観光を詰め込みすぎないこと。" : ""}
${articleMealImages.length ? "食事を楽しみたいなら、夕食開始時間と子どもの眠気まで考えてプランを選ぶこと。" : ""}

記事内の楽天トラベルリンクから、家族人数を入力して最新料金・空室・プラン条件を確認できます。

`;

  const content = baseContent;

  return {
    id: "hotel-" + String(hotel.hotelNo || Date.now()),
    title,
    area: /大分/.test(address) ? "oita" : /福岡/.test(address) ? "fukuoka" : /熊本/.test(address) ? "kumamoto" : /佐賀/.test(address) ? "saga" : /長崎/.test(address) ? "nagasaki" : /宮崎/.test(address) ? "miyazaki" : /鹿児島/.test(address) ? "kagoshima" : "kyushu",
    category: "hotel",
    icon: "🏨",
    excerpt: chooseBySeed([
      `${name}を赤ちゃん・幼児・小学生それぞれの目線でチェック。客室、食事、お風呂、遊び、料金まで家族の1泊2日を想像しながら整理します。`,
      `${name}は子連れで泊まりやすい？写真と施設情報から、寝かしつけ・食事・館内移動・家族全員の総額まで具体的に見ていきます。`,
      `${pref}旅行で${name}を候補にしている家族向けに、子どもの年齢別ポイントとホテルでの過ごし方をわかりやすく紹介します。`,
      `${name}を家族旅行で選ぶ前に、写真から客室・食事・設備を確認し、1泊2日の動きまでイメージできるようまとめました。`
    ], seed, 2),
    content,
    tags: [name, pref, "子連れホテル", "家族旅行", "九州旅行", ...seoIntentLabels.map(x => `${x}ホテル`)],
    ageGroups: ["0-2歳","3-6歳","7歳以上"],
    practical: ["家族全員の総額を確認","最近の口コミを確認","必須設備を事前確認","移動とホテル時間をセットで考える"],
    seoMetaDescription: `${name}を子連れ・家族旅行目線で紹介。${primarySeoIntent}、客室、写真、料金、口コミ、アクセスなど予約前に確認したいポイントを詳しく解説します。`,
    seoKeywords: [name+" 子連れ",name+" 家族旅行",name+" 口コミ",name+" 料金",pref+" 子連れ ホテル",...seoIntentLabels.map(x=>name+" "+x)].join(",")
  };
}


const KYUSHU_PREFECTURES = [
  { name: "福岡県", area: "fukuoka" },
  { name: "佐賀県", area: "saga" },
  { name: "長崎県", area: "nagasaki" },
  { name: "熊本県", area: "kumamoto" },
  { name: "大分県", area: "oita" },
  { name: "宮崎県", area: "miyazaki" },
  { name: "鹿児島県", area: "kagoshima" }
];

const FAMILY_SEARCH_KEYWORDS = ["ファミリー", "子連れ", "家族旅行", "赤ちゃん"];

function sleepMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function safeText(v) {
  return String(v == null ? "" : v);
}

function findMiddleClassCode(node, targetName) {
  if (!node || typeof node !== "object") return "";
  if (
    typeof node.middleClassCode === "string" &&
    safeText(node.middleClassName).includes(targetName.replace("県", ""))
  ) {
    return node.middleClassCode;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findMiddleClassCode(child, targetName);
      if (found) return found;
    }
    return "";
  }
  for (const value of Object.values(node)) {
    const found = findMiddleClassCode(value, targetName);
    if (found) return found;
  }
  return "";
}

async function rakutenServerFetch(url, env) {
  let last = { ok:false, status:0, data:{}, text:"" };

  for (let attempt = 0; attempt < 3; attempt++) {
    const headers = new Headers({
      "accept": "application/json",
      "referer": "https://kyushu-family-trip-navi-worker.rrwpvwmz8p.workers.dev/admin.html",
      "origin": "https://kyushu-family-trip-navi-worker.rrwpvwmz8p.workers.dev"
    });

    const r = await fetch(new Request(url, { method:"GET", headers, redirect:"follow" }));
    const text = await r.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}

    last = { ok:r.ok, status:r.status, data, text };

    const msg = safeText(data?.error_description || data?.message || data?.error || text);
    const limited = r.status === 429 || /rate\s*limit|too many requests|try again in/i.test(msg);
    if (r.ok) return last;

    if (limited && attempt < 2) {
      await sleepMs(1500 * (attempt + 1));
      continue;
    }
    return last;
  }
  return last;
}

function normalizeHotelCandidates(data) {
  const rows = normalizeRakutenHotels(data);
  return rows.map(h => ({
    ...h,
    reviewAverage: Number(h.reviewAverage || 0),
    reviewCount: Number(h.reviewCount || 0),
    hotelMinCharge: Number(h.hotelMinCharge || 0)
  }));
}


async function fetchRakutenHotelDetail(hotelNo, env) {
  if (!hotelNo || !env.RAKUTEN_APPLICATION_ID || !env.RAKUTEN_ACCESS_KEY) return null;

  const params = new URLSearchParams({
    applicationId: env.RAKUTEN_APPLICATION_ID,
    accessKey: env.RAKUTEN_ACCESS_KEY,
    format: "json",
    formatVersion: "2",
    hotelNo: String(hotelNo),
    responseType: "large",
    hotelThumbnailSize: "3"
  });
  if (env.RAKUTEN_AFFILIATE_ID) params.set("affiliateId", env.RAKUTEN_AFFILIATE_ID);

  const detailRes = await rakutenServerFetch(
    "https://openapi.rakuten.co.jp/engine/api/Travel/HotelDetailSearch/20260731?" + params.toString(),
    env
  );

  if (!detailRes.ok) return null;
  return normalizeHotelCandidates(detailRes.data)[0] || null;
}

function candidateScore(h) {
  const rating = Number(h.reviewAverage || 0);
  const reviews = Number(h.reviewCount || 0);
  const price = Number(h.hotelMinCharge || 0);
  let score = 0;
  if (rating) score += rating * 25;
  score += Math.min(35, Math.log10(reviews + 1) * 14);
  if (reviews >= 100) score += 8;
  if (reviews >= 500) score += 6;
  if (rating >= 4.3) score += 12;
  if (rating >= 4.5) score += 8;
  if (price > 0 && price <= 30000) score += 5;
  return score;
}

async function ensureAutoHotelLogTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS auto_hotel_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    runAt TEXT NOT NULL,
    status TEXT NOT NULL,
    prefecture TEXT,
    keyword TEXT,
    hotelNo TEXT,
    hotelName TEXT,
    articleId TEXT,
    message TEXT
  )`).run();
}

async function writeAutoHotelLog(db, row) {
  await ensureAutoHotelLogTable(db);
  await db.prepare(`INSERT INTO auto_hotel_runs
    (runAt,status,prefecture,keyword,hotelNo,hotelName,articleId,message)
    VALUES (?,?,?,?,?,?,?,?)`).bind(
      new Date().toISOString(),
      row.status || "",
      row.prefecture || "",
      row.keyword || "",
      row.hotelNo || "",
      row.hotelName || "",
      row.articleId || "",
      row.message || ""
    ).run();
}

async function lastAutoHotelLog(db) {
  await ensureAutoHotelLogTable(db);
  return await db.prepare(`SELECT * FROM auto_hotel_runs ORDER BY id DESC LIMIT 1`).first();
}

async function autoCreateKyushuHotelArticle(env, options = {}) {
  if (!env.DB) throw new Error("D1 binding DB is not configured");
  if (!env.RAKUTEN_APPLICATION_ID || !env.RAKUTEN_ACCESS_KEY) {
    throw new Error("Rakuten API secrets are not configured");
  }

  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const daySeed = Math.floor(jstDate.getTime() / 86400000);

  const pref = options.prefecture
    ? KYUSHU_PREFECTURES.find(x => x.name === options.prefecture || x.area === options.prefecture)
    : KYUSHU_PREFECTURES[daySeed % KYUSHU_PREFECTURES.length];

  if (!pref) throw new Error("Unknown prefecture");

  // 1) 楽天の地区コードを取得。コードをハードコードしないので仕様変更に強い。
  const areaParams = new URLSearchParams({
    applicationId: env.RAKUTEN_APPLICATION_ID,
    accessKey: env.RAKUTEN_ACCESS_KEY,
    format: "json",
    formatVersion: "2"
  });
  const areaRes = await rakutenServerFetch(
    "https://openapi.rakuten.co.jp/engine/api/Travel/GetAreaClass/20140210?" + areaParams.toString(),
    env
  );
  if (!areaRes.ok) {
    await writeAutoHotelLog(env.DB, {
      status:"error", prefecture:pref.name,
      message:"GetAreaClass failed: HTTP " + areaRes.status
    });
    throw new Error("GetAreaClass failed: HTTP " + areaRes.status);
  }

  const middleClassCode = findMiddleClassCode(areaRes.data, pref.name);
  if (!middleClassCode) {
    await writeAutoHotelLog(env.DB, {
      status:"error", prefecture:pref.name,
      message:"middleClassCode not found"
    });
    throw new Error("middleClassCode not found for " + pref.name);
  }

  let candidates = [];
  let usedKeyword = "";

  // 2) ファミリー系キーワードを順番に試す。API連打を避けて各検索間隔を空ける。
  const keywordStart = daySeed % FAMILY_SEARCH_KEYWORDS.length;
  for (let i = 0; i < FAMILY_SEARCH_KEYWORDS.length; i++) {
    const keyword = FAMILY_SEARCH_KEYWORDS[(keywordStart + i) % FAMILY_SEARCH_KEYWORDS.length];
    const params = new URLSearchParams({
      applicationId: env.RAKUTEN_APPLICATION_ID,
      accessKey: env.RAKUTEN_ACCESS_KEY,
      format: "json",
      formatVersion: "2",
      keyword,
      middleClassCode,
      searchField: "0",
      hits: "30",
      responseType: "middle",
      hotelThumbnailSize: "3"
    });
    if (env.RAKUTEN_AFFILIATE_ID) params.set("affiliateId", env.RAKUTEN_AFFILIATE_ID);

    if (i > 0) await sleepMs(1400);

    const searchRes = await rakutenServerFetch(
      "https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20260731?" + params.toString(),
      env
    );

    if (!searchRes.ok) continue;

    const rows = normalizeHotelCandidates(searchRes.data);
    if (rows.length) {
      candidates = rows;
      usedKeyword = keyword;
      break;
    }
  }

  if (!candidates.length) {
    await writeAutoHotelLog(env.DB, {
      status:"skip", prefecture:pref.name,
      message:"No family hotel candidates found"
    });
    return { ok:false, skipped:true, reason:"候補ホテルが見つかりませんでした", prefecture:pref.name };
  }

  // 3) おすすめ記事として公開できる最低品質を満たす候補だけを対象にする。
  candidates = candidates.filter(h => {
    const rating = Number(h.reviewAverage || 0);
    const reviews = Number(h.reviewCount || 0);
    const facts = [h.address, h.access, h.hotelSpecial, h.hotelMinCharge].filter(Boolean).length;
    return h.hotelNo && h.hotelName && h.address && facts >= 2 &&
      ((rating >= 4.0 && reviews >= 20) || (rating >= 4.3 && reviews >= 8));
  });

  candidates.sort((a,b) => candidateScore(b) - candidateScore(a));

  let selected = null;
  for (const h of candidates) {
    const articleId = "hotel-" + h.hotelNo;
    const exists = await env.DB.prepare("SELECT id FROM articles WHERE id = ? LIMIT 1").bind(articleId).first();
    if (exists) continue;
    selected = h;
    break;
  }

  if (!selected) {
    await writeAutoHotelLog(env.DB, {
      status:"skip", prefecture:pref.name, keyword:usedKeyword,
      message:"All candidates already published"
    });
    return { ok:false, skipped:true, reason:"候補はすべて記事化済みです", prefecture:pref.name };
  }

  // 4) 詳細情報を追加取得。客室写真・評価詳細・館内情報もここで補完。
  await sleepMs(1400);
  const detailed = await fetchRakutenHotelDetail(selected.hotelNo, env);
  if (detailed) selected = { ...selected, ...detailed };

  const article = buildFamilyHotelArticle(selected);
  const rakutenUrl = safeText(selected.hotelInformationUrl || selected.planListUrl);
  if (!rakutenUrl) {
    await writeAutoHotelLog(env.DB, {
      status:"error", prefecture:pref.name, keyword:usedKeyword,
      hotelNo:String(selected.hotelNo), hotelName:selected.hotelName,
      message:"Affiliate/hotel URL missing"
    });
    throw new Error("Rakuten hotel URL missing");
  }

  const coverImage = safeText(selected.hotelImageUrl || selected.hotelThumbnailUrl);

  await env.DB.prepare(`INSERT OR REPLACE INTO articles (
    id,title,area,category,icon,coverImage,coverAlt,excerpt,content,tags,ageGroups,practical,
    affiliateRakuten,affiliateJalan,affiliateYahoo,seoMetaDescription,seoKeywords,published,featured,date,updatedAt
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    article.id, article.title, article.area, article.category, article.icon,
    coverImage, selected.hotelName || article.title,
    article.excerpt, article.content,
    JSON.stringify(article.tags), JSON.stringify(article.ageGroups), JSON.stringify(article.practical),
    rakutenUrl, "", "",
    article.seoMetaDescription, article.seoKeywords,
    1, 0, todayJst(), todayJst()
  ).run();

  await writeAutoHotelLog(env.DB, {
    status:"success",
    prefecture:pref.name,
    keyword:usedKeyword,
    hotelNo:String(selected.hotelNo || ""),
    hotelName:selected.hotelName || "",
    articleId:article.id,
    message:"自動記事作成完了"
  });

  return {
    ok:true,
    prefecture:pref.name,
    keyword:usedKeyword,
    hotelNo:selected.hotelNo,
    hotelName:selected.hotelName,
    reviewAverage:selected.reviewAverage || null,
    reviewCount:selected.reviewCount || null,
    articleId:article.id,
    url:"/article.html?id=" + encodeURIComponent(article.id),
    affiliateEnabled:!!env.RAKUTEN_AFFILIATE_ID
  };
}



const GITHUB_REPO_FULL_NAME = "yuuji0628/kyushu-family-trip-navi";
const GITHUB_DEFAULT_BRANCH = "main";

function githubHeaders(env) {
  return {
    "accept": "application/vnd.github+json",
    "authorization": "Bearer " + env.GITHUB_TOKEN,
    "x-github-api-version": "2022-11-28",
    "user-agent": "kyushu-family-trip-navi-worker"
  };
}

async function githubRequest(env, path, options = {}) {
  if (!env.GITHUB_TOKEN) {
    return { ok:false, status:500, data:{ error:"GITHUB_TOKEN is not configured" } };
  }
  const url = "https://api.github.com/repos/" + GITHUB_REPO_FULL_NAME + path;
  const r = await fetch(url, {
    ...options,
    headers:{ ...githubHeaders(env), ...(options.headers || {}) }
  });
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw:text }; }
  return { ok:r.ok, status:r.status, data };
}

async function handleGithubStatus(request, env) {
  if (!requireAuth(request, env)) return unauthorized();
  if (!env.GITHUB_TOKEN) {
    return json({
      ok:false,
      configured:false,
      repository:GITHUB_REPO_FULL_NAME,
      branch:GITHUB_DEFAULT_BRANCH,
      error:"GITHUB_TOKEN が未設定です"
    });
  }

  const r = await githubRequest(env, "");
  return json({
    ok:r.ok,
    configured:true,
    repository:GITHUB_REPO_FULL_NAME,
    branch:GITHUB_DEFAULT_BRANCH,
    status:r.status,
    repositoryName:r.data?.full_name || GITHUB_REPO_FULL_NAME,
    error:r.ok ? "" : (r.data?.message || "GitHub connection failed")
  }, { status:r.ok ? 200 : 502 });
}


function readU16LE(bytes, offset) {
  return bytes[offset] | (bytes[offset+1] << 8);
}
function readU32LE(bytes, offset) {
  return (bytes[offset] | (bytes[offset+1] << 8) | (bytes[offset+2] << 16) | (bytes[offset+3] << 24)) >>> 0;
}

function parseStoredZip(buffer) {
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8");
  const files = [];
  let pos = 0;

  while (pos + 30 <= bytes.length) {
    const sig = readU32LE(bytes, pos);
    if (sig === 0x04034b50) {
      const flags = readU16LE(bytes, pos + 6);
      const method = readU16LE(bytes, pos + 8);
      const compSize = readU32LE(bytes, pos + 18);
      const uncompSize = readU32LE(bytes, pos + 22);
      const nameLen = readU16LE(bytes, pos + 26);
      const extraLen = readU16LE(bytes, pos + 28);

      if (flags & 0x08) throw new Error("データディスクリプタ形式のZIPは未対応です。");
      if (method !== 0) throw new Error("このZIPは圧縮されています。管理画面用ZIPを使用してください。");

      const nameStart = pos + 30;
      const dataStart = nameStart + nameLen + extraLen;
      const dataEnd = dataStart + compSize;
      if (dataEnd > bytes.length) throw new Error("ZIPデータが壊れています。");

      const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLen));
      if (!name.endsWith("/")) {
        files.push({
          name,
          bytes: bytes.slice(dataStart, dataEnd),
          uncompSize
        });
      }
      pos = dataEnd;
      continue;
    }
    if (sig === 0x02014b50 || sig === 0x06054b50) break;
    pos++;
  }

  if (!files.length) throw new Error("ZIP内にファイルがありません。");
  return files;
}

function topFolderPrefix(names) {
  const clean = names.map(x => String(x || "").replace(/^\/+/, "")).filter(Boolean);
  if (!clean.length) return "";
  const first = clean[0].split("/")[0];
  if (!first) return "";
  return clean.every(p => p === first || p.startsWith(first + "/")) ? first + "/" : "";
}

function bytesToBase64Worker(bytes) {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(s);
}

async function handleGithubZipForm(request, env) {
  if (!requireAuth(request, env)) return unauthorized();
  if (request.method !== "POST") return json({ error:"Method not allowed" }, { status:405 });
  if (!env.GITHUB_TOKEN) return json({ error:"GITHUB_TOKEN が未設定です" }, { status:500 });

  const form = await request.formData();
  const file = form.get("zipfile");
  if (!(file instanceof File)) return json({ error:"ZIPファイルを選択してください" }, { status:400 });

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength > 8_000_000) return json({ error:"ZIPファイルが大きすぎます" }, { status:413 });

  let entries;
  try {
    entries = parseStoredZip(buffer);
  } catch (e) {
    return json({ error:String(e?.message || e) }, { status:400 });
  }

  const names = entries.map(x => x.name).filter(n => !n.includes("__MACOSX/") && !n.endsWith(".DS_Store"));
  const prefix = topFolderPrefix(names);

  const results = [];
  for (const entry of entries) {
    if (entry.name.includes("__MACOSX/") || entry.name.endsWith(".DS_Store")) continue;
    let path = prefix && entry.name.startsWith(prefix) ? entry.name.slice(prefix.length) : entry.name;
    path = path.replace(/^\/+/, "");
    if (!path || path.startsWith(".git/") || path.includes("..")) continue;

    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const get = await githubRequest(env, "/contents/" + encodedPath + "?ref=" + encodeURIComponent(GITHUB_DEFAULT_BRANCH), { method:"GET" });

    let sha = "";
    if (get.ok) sha = String(get.data?.sha || "");
    else if (get.status !== 404) {
      results.push({ path, ok:false, error:get.data?.message || ("HTTP " + get.status) });
      continue;
    }

    const payload = {
      message:"Admin ZIP deploy: " + path,
      content:bytesToBase64Worker(entry.bytes),
      branch:GITHUB_DEFAULT_BRANCH
    };
    if (sha) payload.sha = sha;

    const put = await githubRequest(env, "/contents/" + encodedPath, {
      method:"PUT",
      headers:{ "content-type":"application/json" },
      body:JSON.stringify(payload)
    });

    results.push({
      path,
      ok:put.ok,
      error:put.ok ? "" : (put.data?.message || ("HTTP " + put.status))
    });
  }

  const success = results.filter(x => x.ok).length;
  const failed = results.filter(x => !x.ok);

  return json({
    ok:failed.length === 0,
    success,
    failed:failed.length,
    results
  }, { status:failed.length === 0 ? 200 : 207 });
}

async function handleGithubFileUpload(request, env) {
  if (!requireAuth(request, env)) return unauthorized();
  if (request.method !== "POST") return json({ error:"Method not allowed" }, { status:405 });
  if (!env.GITHUB_TOKEN) return json({ error:"GITHUB_TOKEN が未設定です" }, { status:500 });

  const body = await request.json().catch(() => ({}));
  const path = String(body.path || "").replace(/^\/+/, "");
  const contentBase64 = String(body.contentBase64 || "");
  const message = String(body.message || "Admin ZIP deploy").slice(0, 200);
  const branch = String(body.branch || GITHUB_DEFAULT_BRANCH);

  if (!path || !contentBase64) return json({ error:"path / contentBase64 が必要です" }, { status:400 });
  if (path.includes("..") || path.startsWith(".git/") || path === ".git") {
    return json({ error:"許可されていないパスです" }, { status:400 });
  }
  if (contentBase64.length > 12_000_000) {
    return json({ error:"1ファイルが大きすぎます" }, { status:413 });
  }

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const get = await githubRequest(env, "/contents/" + encodedPath + "?ref=" + encodeURIComponent(branch), { method:"GET" });

  let sha = "";
  if (get.ok) sha = String(get.data?.sha || "");
  else if (get.status !== 404) {
    return json({ error:"GitHubファイル確認失敗", githubStatus:get.status, details:get.data?.message || "" }, { status:502 });
  }

  const payload = { message, content:contentBase64, branch };
  if (sha) payload.sha = sha;

  const put = await githubRequest(env, "/contents/" + encodedPath, {
    method:"PUT",
    headers:{ "content-type":"application/json" },
    body:JSON.stringify(payload)
  });

  if (!put.ok) {
    return json({
      error:"GitHub更新失敗",
      path,
      githubStatus:put.status,
      details:put.data?.message || ""
    }, { status:502 });
  }

  return json({
    ok:true,
    path,
    created:!sha,
    commitSha:put.data?.commit?.sha || ""
  });
}

async function handleAdminDashboard(request, env) {
  if (!requireAuth(request, env)) return unauthorized();
  if (!env.DB) return json({ error:"D1 binding DB is not configured" }, { status:500 });

  let articleStats = { total:0, published:0, drafts:0, affiliateCount:0 };
  let runStats = { totalRuns:0, successRuns:0, errorRuns:0, skipRuns:0 };
  let recent = [];
  let warnings = [];

  // Articles are the most important dashboard data. Load this independently.
  try {
    const row = await env.DB.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN published = 1 THEN 1 ELSE 0 END) AS published,
        SUM(CASE WHEN published = 0 THEN 1 ELSE 0 END) AS drafts,
        SUM(CASE WHEN affiliateRakuten IS NOT NULL AND affiliateRakuten <> '' THEN 1 ELSE 0 END) AS affiliateCount
      FROM articles
    `).first();
    articleStats = {
      total:Number(row?.total || 0),
      published:Number(row?.published || 0),
      drafts:Number(row?.drafts || 0),
      affiliateCount:Number(row?.affiliateCount || 0)
    };
  } catch (e) {
    warnings.push("記事統計: " + String(e?.message || e));
  }

  // Auto-run history must never prevent the dashboard from opening.
  try {
    await ensureAutoHotelLogTable(env.DB);
    const row = await env.DB.prepare(`
      SELECT
        COUNT(*) AS totalRuns,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successRuns,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS errorRuns,
        SUM(CASE WHEN status = 'skip' THEN 1 ELSE 0 END) AS skipRuns
      FROM auto_hotel_runs
    `).first();

    runStats = {
      totalRuns:Number(row?.totalRuns || 0),
      successRuns:Number(row?.successRuns || 0),
      errorRuns:Number(row?.errorRuns || 0),
      skipRuns:Number(row?.skipRuns || 0)
    };

    const rr = await env.DB.prepare(`
      SELECT id, runAt, status, prefecture, keyword, hotelNo, hotelName, articleId, message
      FROM auto_hotel_runs
      ORDER BY id DESC
      LIMIT 8
    `).all();
    recent = rr?.results || [];
  } catch (e) {
    warnings.push("自動作成履歴: " + String(e?.message || e));
  }

  return json({
    ok:true,
    partial:warnings.length > 0,
    warnings,
    articles:articleStats,
    automation:{
      ...runStats,
      last:recent[0] || null,
      recent
    },
    integrations:{
      rakutenApplicationId:!!env.RAKUTEN_APPLICATION_ID,
      rakutenAccessKey:!!env.RAKUTEN_ACCESS_KEY,
      rakutenAffiliateId:!!env.RAKUTEN_AFFILIATE_ID,
      githubToken:!!env.GITHUB_TOKEN,
      d1:!!env.DB
    },
    schedule:{
      label:"毎朝 6:10",
      timezone:"JST",
      cron:"10 21 * * *"
    }
  });
}

async function handleAutoHotelApi(request, env) {
  if (!requireAuth(request, env)) return unauthorized();

  if (request.method === "GET") {
    const last = await lastAutoHotelLog(env.DB);
    return json({ ok:true, last });
  }

  if (request.method === "POST") {
    try {
      const result = await autoCreateKyushuHotelArticle(env);
      return json(result);
    } catch (e) {
      return json({ ok:false, error:String(e?.message || e) }, { status:500 });
    }
  }

  return json({ error:"Method not allowed" }, { status:405 });
}

async function createGenericHotelArticle(request, env) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured" }, { status: 500 });
  if (!requireAuth(request, env)) return unauthorized();
  if (request.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const input = await request.json().catch(() => ({}));
  let hotel = input.hotel || {};

  // 検索結果だけで記事化せず、施設番号があれば必ず詳細APIを追加取得。
  // ここで roomImageUrl / roomThumbnailUrl なども補完する。
  if (hotel.hotelNo) {
    const detailed = await fetchRakutenHotelDetail(hotel.hotelNo, env);
    if (detailed) hotel = { ...hotel, ...detailed };
  }

  const rakutenUrl = String(input.rakutenUrl || hotel.hotelInformationUrl || hotel.planListUrl || "").trim();

  if (!hotel.hotelName || !rakutenUrl) {
    return json({ error: "ホテル情報または楽天URLが不足しています。" }, { status: 400 });
  }

  const a = buildFamilyHotelArticle(hotel);
  const coverImage = String(hotel.hotelImageUrl || hotel.hotelThumbnailUrl || hotel.roomImageUrl || "").trim();

  await env.DB.prepare(`INSERT OR REPLACE INTO articles (
    id,title,area,category,icon,coverImage,coverAlt,excerpt,content,tags,ageGroups,practical,
    affiliateRakuten,affiliateJalan,affiliateYahoo,seoMetaDescription,seoKeywords,published,featured,date,updatedAt
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    a.id,a.title,a.area,a.category,a.icon,coverImage,a.title,a.excerpt,a.content,
    JSON.stringify(a.tags),JSON.stringify(a.ageGroups),JSON.stringify(a.practical),
    rakutenUrl,"","",a.seoMetaDescription,a.seoKeywords,1,0,todayJst(),todayJst()
  ).run();

  return json({
    ok: true,
    id: a.id,
    title: a.title,
    url: "/article.html?id=" + encodeURIComponent(a.id),
    charCount: a.content.length
  });
}

async function createSuginoiArticle(request, env) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured" }, { status: 500 });
  if (!requireAuth(request, env)) return unauthorized();
  if (request.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const input = await request.json().catch(() => ({}));
  const rakutenUrl = String(input.rakutenUrl || "").trim();
  const coverImage = String(input.coverImage || "").trim();

  if (!rakutenUrl) {
    return json({ error: "先に楽天ホテル検索で杉乃井ホテルを選択してください。" }, { status: 400 });
  }

  const a = SUGINOI_ARTICLE;
  await env.DB.prepare(`INSERT OR REPLACE INTO articles (
    id,title,area,category,icon,coverImage,coverAlt,excerpt,content,tags,ageGroups,practical,
    affiliateRakuten,affiliateJalan,affiliateYahoo,seoMetaDescription,seoKeywords,published,featured,date,updatedAt
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    a.id,a.title,a.area,a.category,a.icon,coverImage,"別府温泉 杉乃井ホテル",
    a.excerpt,a.content,JSON.stringify(a.tags),JSON.stringify(a.ageGroups),JSON.stringify(a.practical),
    rakutenUrl,"","",a.seoMetaDescription,a.seoKeywords,1,1,todayJst(),todayJst()
  ).run();

  const saved = (await listArticles(env.DB, { id: a.id, published: false }))[0];
  return json({ ok: true, article: saved, url: "/article.html?id=" + encodeURIComponent(a.id) });
}

function pickHotelBasicInfo(item) {
  if (!item) return null;
  if (item.hotelBasicInfo) return item.hotelBasicInfo;
  if (item.hotel && item.hotel.hotelBasicInfo) return item.hotel.hotelBasicInfo;
  if (Array.isArray(item)) {
    for (const x of item) {
      if (x?.hotelBasicInfo) return x.hotelBasicInfo;
      if (x?.hotel?.hotelBasicInfo) return x.hotel.hotelBasicInfo;
    }
  }
  return null;
}

function findHotelSection(item, key) {
  if (!item) return null;
  if (Array.isArray(item)) {
    for (const x of item) {
      const found = findHotelSection(x, key);
      if (found) return found;
    }
    return null;
  }
  if (typeof item !== "object") return null;
  if (item[key]) return item[key];
  if (item.hotel && item.hotel[key]) return item.hotel[key];
  for (const value of Object.values(item)) {
    if (value && typeof value === "object") {
      const found = findHotelSection(value, key);
      if (found) return found;
    }
  }
  return null;
}


function rakutenImageCategory(path = "", url = "") {
  const p = (String(path) + " " + String(url)).toLowerCase();

  // Strong visual-category cues take priority over generic field names such as roomImageUrl.
  if (/breakfast|dinner|meal|food|restaurant|cuisine|buffet|breakfastbuffet|朝食|夕食|食事|料理|バイキング|ビュッフェ/.test(p)) return "meal";
  if (/pool|aqua|waterpool|swimming|プール|水遊び/.test(p)) return "pool";
  if (/bath|onsen|spa|hotspring|hot-spring|露天|温泉|風呂|大浴場/.test(p)) return "bath";
  if (/lobby|facility|facilities|hall|館内|施設/.test(p)) return "facility";
  if (/plan/.test(p)) return "plan";
  if (/hotel|main|exterior|outside|外観/.test(p)) return "hotel";

  // Room is deliberately last. Rakuten sometimes returns a non-room photo in roomImageUrl.
  // Only use "room" when there is an additional room/bed/guest cue in URL/path.
  if (/room|guestroom|bedroom|bed|客室|和室|洋室/.test(p)) return "room";
  return "other";
}

function collectRakutenImages(node, path = "", out = []) {
  if (!node) return out;
  if (typeof node === "string") {
    const imageLikePath = /image|photo|picture|thumbnail|img|画像|写真/i.test(path);
    const imageLikeUrl = /\.(?:jpe?g|png|webp|avif)(?:\?|$)/i.test(node) || /image|photo|picture/i.test(node);
    if (/^https?:\/\//i.test(node) && isAllowedArticleImageUrl(node) && (imageLikePath || imageLikeUrl)) {
      out.push({ url:node, category:rakutenImageCategory(path, node), path });
    }
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((v,i) => collectRakutenImages(v, path+"["+i+"]", out));
    return out;
  }
  if (typeof node === "object") {
    for (const [k,v] of Object.entries(node)) {
      collectRakutenImages(v, path ? path+"."+k : k, out);
    }
  }
  return out;
}

function normalizeRakutenImageGallery(item, basic = {}) {
  const raw = collectRakutenImages(item);
  [
    ["hotel", basic.hotelImageUrl],
    ["hotel", basic.hotelThumbnailUrl],
    ["roomCandidate", basic.roomImageUrl],
    ["roomCandidate", basic.roomThumbnailUrl],
    ["plan", basic.planImageUrl],
    ["plan", basic.planThumbnailUrl]
  ].forEach(([category,url]) => {
    if (!url || !isAllowedArticleImageUrl(url)) return;
    const detected = category === "roomCandidate"
      ? rakutenImageCategory("basic.roomImageUrl", url)
      : category;
    raw.push({
      url,
      category: detected === "room" ? "room" : (category === "roomCandidate" ? "other" : detected),
      path:"basic."+category
    });
  });

  const isThumb = x => /thumbnail/i.test(x.path || "") || /thumbnail/i.test(x.url || "");
  const exact = new Map();

  for (const img of raw) {
    if (!img.url) continue;
    const key = canonicalArticleImageKey(img.url);
    const prev = exact.get(key);
    if (!prev || (isThumb(prev) && !isThumb(img))) exact.set(key, img);
  }

  const arr = [...exact.values()].map(x => ({
    url:x.url,
    category:x.category || "other",
    isThumbnail:isThumb(x)
  }));

  // For article body, prefer originals. Thumbnail is retained only if that category
  // has no original image at all.
  const originals = new Set(arr.filter(x => !x.isThumbnail).map(x => x.category));
  return arr.filter(x => !x.isThumbnail || !originals.has(x.category));
}

function normalizeRakutenHotels(data) {
  const source = Array.isArray(data?.hotels) ? data.hotels : (Array.isArray(data?.items) ? data.items : []);
  const hotels = [];
  for (const item of source) {
    const basic = pickHotelBasicInfo(item) || item?.hotelBasicInfo || item;
    if (!basic || !basic.hotelName) continue;

    const rating = findHotelSection(item, "hotelRatingInfo") || {};
    const detail = findHotelSection(item, "hotelDetailInfo") || {};
    const facilities = findHotelSection(item, "hotelFacilitiesInfo") || {};
    const policy = findHotelSection(item, "hotelPolicyInfo") || {};

    const imageGallery = normalizeRakutenImageGallery(item, basic);

    hotels.push({
      hotelNo: basic.hotelNo || "",
      hotelName: basic.hotelName || "",
      hotelKanaName: basic.hotelKanaName || "",
      hotelInformationUrl: basic.hotelInformationUrl || "",
      planListUrl: basic.planListUrl || "",
      reviewUrl: basic.reviewUrl || "",
      hotelSpecial: basic.hotelSpecial || "",
      hotelMinCharge: basic.hotelMinCharge ?? null,
      address: [basic.address1, basic.address2].filter(Boolean).join(""),
      access: basic.access || "",
      parkingInformation: basic.parkingInformation || "",
      nearestStation: basic.nearestStation || "",
      hotelImageUrl: basic.hotelImageUrl || "",
      hotelThumbnailUrl: basic.hotelThumbnailUrl || "",
      roomImageUrl: basic.roomImageUrl || "",
      roomThumbnailUrl: basic.roomThumbnailUrl || "",
      hotelMapImageUrl: basic.hotelMapImageUrl || "",
      reviewAverage: basic.reviewAverage ?? null,
      reviewCount: basic.reviewCount ?? null,
      userReview: basic.userReview || "",

      serviceAverage: rating.serviceAverage ?? null,
      locationAverage: rating.locationAverage ?? null,
      roomAverage: rating.roomAverage ?? null,
      equipmentAverage: rating.equipmentAverage ?? null,
      bathAverage: rating.bathAverage ?? null,
      breakfastAverage: rating.breakfastAverage ?? null,
      dinnerAverage: rating.dinnerAverage ?? null,
      cleanlinessAverage: rating.cleanlinessAverage ?? null,

      areaName: detail.areaName || "",
      checkinTime: detail.checkinTime || "",
      checkoutTime: detail.checkoutTime || "",
      lastCheckinTime: detail.lastCheckinTime || "",
      hotelRoomNum: facilities.hotelRoomNum || "",
      roomFacilities: facilities.roomFacilities || [],
      hotelFacilities: facilities.hotelFacilities || [],
      breakfastPlace: facilities.breakfastPlace || "",
      dinnerPlace: facilities.dinnerPlace || "",
      bathType: facilities.bathType || "",
      bathQuality: facilities.bathQuality || "",
      bathBenefits: facilities.bathBenefits || "",
      aboutLeisure: facilities.aboutLeisure || "",
      cancelPolicy: policy.cancelPolicy || "",
      imageGallery
    });
  }
  return hotels;
}

async function handleRakutenHotelSearch(request, env) {
  if (!requireAuth(request, env)) return unauthorized();

  if (!env.RAKUTEN_APPLICATION_ID || !env.RAKUTEN_ACCESS_KEY) {
    return json({ error: "Rakuten API secrets are not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const keyword = (url.searchParams.get("keyword") || "").trim();
  if (keyword.length < 2) {
    return json({ error: "keyword must be at least 2 characters" }, { status: 400 });
  }

  const params = new URLSearchParams({
    applicationId: env.RAKUTEN_APPLICATION_ID,
    accessKey: env.RAKUTEN_ACCESS_KEY,
    format: "json",
    formatVersion: "2",
    keyword,
    searchField: "1",
    hits: "10",
    responseType: "middle",
    hotelThumbnailSize: "3"
  });
  if (env.RAKUTEN_AFFILIATE_ID) params.set("affiliateId", env.RAKUTEN_AFFILIATE_ID);

  const apiUrl = "https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20260731?" + params.toString();

  let r = null;
  let text = "";
  let data = {};
  let lastStatus = 0;

  for (let attempt = 0; attempt < 3; attempt++) {
    const outboundHeaders = new Headers(request.headers);
    outboundHeaders.set("accept", "application/json");
    outboundHeaders.delete("x-admin-password");
    outboundHeaders.delete("authorization");
    outboundHeaders.delete("cookie");
    outboundHeaders.delete("host");
    outboundHeaders.delete("origin");
    outboundHeaders.delete("content-length");

    // 楽天側のReferrer検証に、管理画面から届いた実際のRefererをそのまま転送する。
    // Safari等でRefererが欠落した場合のみ登録済みサイトURLを補完する。
    if (!outboundHeaders.get("referer")) {
      outboundHeaders.set("referer", "https://kyushu-family-trip-navi-worker.rrwpvwmz8p.workers.dev/admin.html");
    }

    // 2026年版楽天APIでは、エラー名がREFERRER_MISSINGでも
    // サーバーサイド呼び出しでは Origin も必要になるケースがある。
    outboundHeaders.set(
      "origin",
      "https://kyushu-family-trip-navi-worker.rrwpvwmz8p.workers.dev"
    );

    const outboundRequest = new Request(apiUrl, {
      method: "GET",
      headers: outboundHeaders,
      redirect: "follow"
    });

    r = await fetch(outboundRequest);
    lastStatus = r.status;
    text = await r.text();

    try { data = JSON.parse(text); }
    catch {
      data = {};
    }

    const msg = String(
      data?.error_description ||
      data?.message ||
      data?.error ||
      text ||
      ""
    );

    const isRateLimited =
      r.status === 429 ||
      /rate\s*limit|too many requests|try again in/i.test(msg);

    if (r.ok) break;

    if (isRateLimited && attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 1300 * (attempt + 1)));
      continue;
    }
    break;
  }

  if (!r || !r.ok) {
    const rawMessage = String(
      data?.error_description ||
      data?.message ||
      data?.error ||
      text ||
      ""
    ).slice(0, 300);

    return json({
      error: "Rakuten API error",
      rakutenStatus: lastStatus,
      rakutenError: data?.error || "",
      rakutenMessage: rawMessage || "Unknown upstream error"
    }, { status: 502 });
  }

  const hotels = normalizeRakutenHotels(data);
  return json({
    ok: true,
    affiliateEnabled: !!env.RAKUTEN_AFFILIATE_ID,
    count: hotels.length,
    hotels
  });
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
      q: url.searchParams.get("q") || undefined,
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


function editorialPolicyPage(url) {
  const body = `<main class="article">
    <div class="badges"><span class="badge">運営情報</span><span class="badge">編集方針</span></div>
    <h1>九州ファミリー旅ナビの編集方針</h1>
    <p class="lead">子連れ旅行で役立つ判断材料を、確認できる情報と編集部の見解を分けて届けます。</p>
    <h2>記事の作り方</h2><p>楽天トラベルAPI等の公開情報を基礎資料とし、料金・評価・口コミ件数・住所・アクセスなどを家族旅行の視点で整理します。情報量や口コミの根拠が一定基準に満たない候補は自動公開しません。</p>
    <h2>実体験を装わない</h2><p>実際に宿泊していない施設について「泊まった」「体験した」など事実と異なる表現は使用しません。確認できない設備も断定しません。</p>
    <h2>情報更新</h2><p>料金・設備・サービス等は変更されるため、記事に確認時点を示し、予約前に最新情報を確認することを推奨します。</p>
    <h2>自動作成について</h2><p>1日1記事を基本とし、重複を除外します。評価・口コミ・施設情報の基準を満たさない場合は作成をスキップします。</p>
    <h2>広告</h2><p>一部の記事にはアフィリエイトリンクを含み、PR表記を行います。</p>
  </main>`;
  const canonical = url.origin + "/editorial-policy.html";
  return html(layout("編集方針｜九州ファミリー旅ナビ", body, `<meta name="description" content="九州ファミリー旅ナビの編集方針、情報源、自動作成、広告について。"><link rel="canonical" href="${esc(canonical)}">`));
}


async function loadAdminSnapshot(env) {
  const snapshot = {
    published:0, affiliateCount:0, successRuns:0,
    recentRuns:[], articles:[], lastRun:null, warning:""
  };
  if (!env.DB) {
    snapshot.warning = "D1 binding DB が見つかりません。";
    return snapshot;
  }

  const warnings = [];

  try {
    const row = await env.DB.prepare(`
      SELECT
        SUM(CASE WHEN published = 1 THEN 1 ELSE 0 END) AS published,
        SUM(CASE WHEN affiliateRakuten IS NOT NULL AND affiliateRakuten <> '' THEN 1 ELSE 0 END) AS affiliateCount
      FROM articles
    `).first();
    snapshot.published = Number(row?.published || 0);
    snapshot.affiliateCount = Number(row?.affiliateCount || 0);
  } catch (e) {
    warnings.push("記事統計: " + String(e?.message || e));
  }

  try {
    const rr = await env.DB.prepare(`
      SELECT *
      FROM articles
      ORDER BY
        CASE WHEN updatedAt IS NULL OR updatedAt = '' THEN 1 ELSE 0 END,
        updatedAt DESC,
        date DESC
      LIMIT 100
    `).all();
    snapshot.articles = rr?.results || [];
  } catch (e) {
    warnings.push("記事一覧: " + String(e?.message || e));
  }

  try {
    await ensureAutoHotelLogTable(env.DB);
    const row = await env.DB.prepare(`
      SELECT SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successRuns
      FROM auto_hotel_runs
    `).first();
    snapshot.successRuns = Number(row?.successRuns || 0);

    const rr = await env.DB.prepare(`
      SELECT id, runAt, status, prefecture, keyword, hotelNo, hotelName, articleId, message
      FROM auto_hotel_runs
      ORDER BY id DESC
      LIMIT 8
    `).all();
    snapshot.recentRuns = rr?.results || [];
    snapshot.lastRun = snapshot.recentRuns[0] || null;
  } catch (e) {
    warnings.push("自動作成履歴: " + String(e?.message || e));
  }

  snapshot.warning = warnings.join(" / ");
  return snapshot;
}

async function adminPage(request, env) {
  const serverAuthed = requireAuth(request, env);
  const adminUrl = new URL(request.url);
  const autoResult = adminUrl.searchParams.get("auto") || "";
  const autoMessage = adminUrl.searchParams.get("msg") || "";
  const autoArticleUrl = adminUrl.searchParams.get("article") || "";
  const deleteResult = adminUrl.searchParams.get("delete") || "";
  const deleteMessage = adminUrl.searchParams.get("msg") || "";
  const hotelSearchKeyword = (adminUrl.searchParams.get("hotelSearch") || "").trim();
  const hotelPick = adminUrl.searchParams.get("hotelPick") || "";
  const hotelCreateResult = adminUrl.searchParams.get("hotelCreate") || "";
  const hotelCreateMessage = adminUrl.searchParams.get("msg") || "";
  const hotelCreateArticleUrl = adminUrl.searchParams.get("article") || "";

  let hotelSearchData = null;
  let hotelSearchError = "";
  let selectedHotel = null;

  if (serverAuthed && hotelSearchKeyword.length >= 2) {
    try {
      const searchUrl = new URL("/api/rakuten-hotels", request.url);
      searchUrl.searchParams.set("keyword", hotelSearchKeyword);
      const searchHeaders = new Headers(request.headers);
      searchHeaders.set("referer", new URL("/admin.html", request.url).toString());

      const searchReq = new Request(searchUrl, { method:"GET", headers:searchHeaders });
      const searchRes = await handleRakutenHotelSearch(searchReq, env);
      const searchJson = await searchRes.json().catch(() => ({}));

      if (searchRes.ok) {
        hotelSearchData = searchJson;
        if (hotelPick) {
          selectedHotel = (searchJson.hotels || []).find(h => String(h.hotelNo || "") === String(hotelPick)) || null;
        }
      } else {
        hotelSearchError = String(searchJson.rakutenMessage || searchJson.error || ("HTTP " + searchRes.status));
      }
    } catch (e) {
      hotelSearchError = String(e?.message || e);
    }
  }

  const hotelSearchResultsHtml = hotelSearchData
    ? ((hotelSearchData.hotels || []).length
        ? `<div class="nativeHotelResults">${(hotelSearchData.hotels || []).map(h => {
            const price = h.hotelMinCharge ? Number(h.hotelMinCharge).toLocaleString() + "円〜" : "料金は予約ページで確認";
            const rating = h.reviewAverage ? `★${esc(h.reviewAverage)}` : "";
            const href = `/admin.html?hotelSearch=${encodeURIComponent(hotelSearchKeyword)}&hotelPick=${encodeURIComponent(h.hotelNo || "")}#hotel-search`;
            return `<div class="nativeHotelCard">
              ${h.hotelThumbnailUrl || h.hotelImageUrl ? `<img src="${esc(h.hotelThumbnailUrl || h.hotelImageUrl)}" alt="${esc(h.hotelName)}" loading="lazy">` : ""}
              <div class="nativeHotelInfo">
                <b>${esc(h.hotelName)}</b>
                <span>${esc(h.address || "")}</span>
                <small>${esc(price)}${rating ? ` ・ ${rating}` : ""}</small>
              </div>
              <a class="btn sub" href="${href}">このホテルを使う</a>
            </div>`;
          }).join("")}</div>`
        : `<div class="smartNotice">該当するホテルが見つかりませんでした。</div>`)
    : "";

  const selectedHotelHtml = selectedHotel ? `<div class="selectedHotelBox">
      <div class="selectedHotelHead">選択中のホテル</div>
      <b>${esc(selectedHotel.hotelName)}</b>
      <span>${esc(selectedHotel.address || "")}</span>
      ${selectedHotel.hotelImageUrl || selectedHotel.hotelThumbnailUrl ? `<img src="${esc(selectedHotel.hotelImageUrl || selectedHotel.hotelThumbnailUrl)}" alt="${esc(selectedHotel.hotelName)}" loading="lazy">` : ""}
      <form method="post" action="/admin-hotel-article">
        <input type="hidden" name="hotelJson" value="${esc(JSON.stringify(selectedHotel))}">
        <input type="hidden" name="rakutenUrl" value="${esc(selectedHotel.hotelInformationUrl || selectedHotel.planListUrl || "")}">
        <button class="btn" type="submit">このホテルの記事を自動作成</button>
      </form>
    </div>` : "";

  const adminSnapshot = serverAuthed ? await loadAdminSnapshot(env) : {
    published:0, affiliateCount:0, successRuns:0, recentRuns:[], articles:[], lastRun:null, warning:""
  };

  const adminArticlesHtml = adminSnapshot.articles.length
    ? adminSnapshot.articles.map(a => {
        const published = Number(a.published || 0) === 1;
        const affiliate = !!a.affiliateRakuten;
        const date = a.updatedAt || a.date || "";
        return `<div class="contentRow">
          <div class="contentMain">
            <div class="contentTitle">${esc(a.title || "無題")}</div>
            <div class="contentMeta">
              <span class="miniBadge ${published ? "ok" : ""}">${published ? "公開" : "下書き"}</span>
              ${affiliate ? `<span class="miniBadge affiliate">楽天リンクあり</span>` : ""}
              ${date ? `<span>${esc(date)}</span>` : ""}
            </div>
          </div>
          <div class="contentActions">
            <a class="btn sub" target="_blank" href="/article.html?id=${encodeURIComponent(a.id || "")}">表示</a>
            <button class="btn sub" type="button" onclick='articleEditDirect(${JSON.stringify(String(a.id || ""))})'>編集</button>
            <form method="post" action="/admin-delete-article" class="inlineNativeForm nativeDeleteForm">
              <input type="hidden" name="id" value="${esc(a.id || "")}">
              <button class="btn dangerBtn" type="submit">削除</button>
            </form>
          </div>
        </div>`;
      }).join("")
    : `<div class="smartNotice">記事はまだありません。</div>`;

  const recentRunsHtml = adminSnapshot.recentRuns.length
    ? adminSnapshot.recentRuns.map(x => {
        const cls = x.status === "error" ? " error" : x.status === "skip" ? " skip" : "";
        return `<div class="activityItem">
          <span class="activityDot${cls}"></span>
          <div>
            <div class="activityTitle">${esc(x.hotelName || x.message || "自動処理")}</div>
            <div class="activityMeta">${esc(x.runAt || "")}${x.prefecture ? ` ・ ${esc(x.prefecture)}` : ""}</div>
          </div>
          <div class="activityState">${esc(x.status || "")}</div>
        </div>`;
      }).join("")
    : `<div class="smartNotice">まだ自動作成履歴はありません。</div>`;

  const lastRun = adminSnapshot.lastRun;
  const initialStatusBadge = lastRun
    ? (lastRun.status === "success" ? "成功" : lastRun.status === "error" ? "エラー" : lastRun.status === "skip" ? "スキップ" : esc(lastRun.status || "完了"))
    : (adminSnapshot.warning ? "一部取得" : "正常");
  const initialStatusClass = lastRun?.status === "error" ? "statusBadge error" : lastRun?.status === "skip" ? "statusBadge skip" : "statusBadge";
  const initialStatusHtml = adminSnapshot.warning
    ? `一部データのみ取得しました：${esc(adminSnapshot.warning)}`
    : lastRun
      ? `<b>${esc(lastRun.hotelName || "自動処理")}</b><br>最終実行：${esc(lastRun.runAt || "")}${lastRun.prefecture ? ` / ${esc(lastRun.prefecture)}` : ""}${lastRun.message ? `<br>${esc(lastRun.message)}` : ""}<br>次回予定：毎朝6:10 JST`
      : `<b>自動実行の準備は完了しています。</b><br>次回予定：毎朝6:10 JST`;
  const loginError = new URL(request.url).searchParams.get("login") === "error";
  const body = `<div id="loginBox" class="login" style="${serverAuthed ? "display:none" : ""}">
    <h2>管理画面ログイン</h2>
    <p>Cloudflare Workers の ADMIN_PASSWORD を入力してください。</p>
    <form method="post" action="/admin-login" autocomplete="off">
      <div class="field"><input id="pw" name="password" class="input" type="password" placeholder="管理パスワード" required></div>
      <button id="loginBtn" class="btn" type="submit">ログイン</button>
    </form>
    <div id="loginStatus" class="small">${loginError ? "パスワードが違います。" : ""}</div>
    <div class="small" style="margin-top:10px;opacity:.65">admin v7.6.0 / SERVER RENDER</div>
  </div>
  <main id="adminApp" class="admin" style="${serverAuthed ? "" : "display:none"}">
    <section class="adminHero">
      <div>
        <div class="eyebrow">KYUSHU FAMILY TRIP NAVI</div>
        <h1>🤖 自動運用ダッシュボード</h1>
        <p>毎朝6:10の自動作成を中心に、記事・楽天API・実行履歴をひとつの画面で確認できます。</p><div class="small" style="margin-top:8px;color:rgba(255,255,255,.65)">dashboard v8.3.0 / FAMILY EDITORIAL</div>
      </div>
      <div class="heroActions">
        <form method="post" action="/admin-auto-create" class="inlineNativeForm">
          <button id="dashAutoRunNativeBtn" class="btn" type="submit">今すぐ1記事作成</button>
        </form>
        <button id="dashRefreshBtn" class="btn sub" type="button" onclick="location.reload()">↻ 更新</button>
        <a id="logoutBtn" class="btn sub" href="/admin-logout">ログアウト</a>
      </div>
    </section>

    <section class="statGrid">
      <div class="statCard"><span>公開記事</span><strong id="statArticles">${adminSnapshot.published}</strong><small>件</small></div>
      <div class="statCard"><span>楽天リンク付き</span><strong id="statAffiliate">${adminSnapshot.affiliateCount}</strong><small>件</small></div>
      <div class="statCard"><span>自動作成成功</span><strong id="statAutoSuccess">${adminSnapshot.successRuns}</strong><small>件</small></div>
      <div class="statCard"><span>次回自動実行</span><strong style="font-size:22px">6:10</strong><small>毎朝 JST</small></div>
    </section>

    <section class="adminGrid2">
      <div class="smartCard">
        <div class="smartCardHead">
          <div><div class="eyebrow">AUTOMATION</div><h2>自動作成ステータス</h2></div>
          <span id="autoStatusBadge" class="${initialStatusClass}">${initialStatusBadge}</span>
        </div>
        <div id="dashAutoStatus" class="timelineBox">${autoResult
        ? (autoResult === "success"
            ? `<b>記事作成完了 ✅</b><br>${esc(autoMessage)}${autoArticleUrl ? ` <a href="${esc(autoArticleUrl)}" target="_blank">記事を見る</a>` : ""}`
            : autoResult === "skip"
              ? `<b>今回はスキップ</b><br>${esc(autoMessage)}`
              : `<b>記事作成エラー</b><br>${esc(autoMessage)}`)
        : initialStatusHtml}</div>
        <div class="miniActions">
          <a class="btn sub" href="/" target="_blank">公開サイト</a>
          <a class="btn sub" href="/articles.html" target="_blank">記事一覧</a>
          <a class="btn sub" href="/sitemap.xml" target="_blank">サイトマップ</a>
        </div>
      </div>

      <div class="smartCard">
        <div class="smartCardHead"><div><div class="eyebrow">QUICK ACTIONS</div><h2>クイック操作</h2></div></div>
        <div class="quickGrid">
          <button id="jumpHotelSearch" class="quickBtn" type="button">🏨<b>ホテル検索</b><span>楽天から手動検索</span></button>
          <button id="jumpArticleEditor" class="quickBtn" type="button">✍️<b>記事編集</b><span>記事を手動編集</span></button>
          <button id="jumpArticleList" class="quickBtn" type="button">📚<b>記事一覧</b><span>既存記事を確認</span></button>
          
          <button id="jumpGithubZip" class="quickBtn" type="button">📦<b>GitHub ZIP</b><span>ZIPから直接反映</span></button>
        </div>
      </div>
    </section>


    <section id="githubZipSection" class="smartCard">
      <div class="smartCardHead">
        <div><div class="eyebrow">GITHUB DEPLOY</div><h2>📦 ZIPからGitHubへ反映</h2></div>
        <span id="githubStatusBadge" class="statusBadge">接続済み</span>
      </div>
      <p class="sectionHint">JavaScriptを使わず、通常のフォーム送信でZIPをGitHubへ反映します。</p>

      <form id="githubZipForm" class="githubUploadBox" enctype="multipart/form-data" onsubmit="return githubZipFormSubmit(event)">
        <label class="filePickerLabel" for="githubZipInput">
          <span class="filePickerIcon">📁</span>
          <span class="filePickerText"><b>ZIPファイルを選ぶ</b><small id="githubFileName">未選択</small></span>
          <input id="githubZipInput" name="zipfile" type="file" accept=".zip,application/zip,.ZIP" required onchange="githubFileNameDirect(this)">
        </label>
        <div class="githubUploadMeta">
          <span>対象: <b>yuuji0628/kyushu-family-trip-navi</b></span>
          <span>ブランチ: <b>main</b></span>
        </div>
        <div class="smartNotice">ChatGPTから受け取った「管理画面用ZIP」をそのまま選択してください。先頭フォルダは自動で外します。</div>
        <div class="miniActions">
          <button id="githubZipUploadBtn" class="btn" type="submit">GitHubへ反映する</button>
          <button id="githubCheckBtn" class="btn sub" type="button" onclick="githubCheckDirect()">接続確認</button>
        </div>
        <div id="githubUploadStatus" class="timelineBox" style="margin-top:12px">待機中</div>
        <div class="small" style="margin-top:8px;opacity:.65">GitHub panel v8.3.0</div>
      </form>
    </section>

    <section class="smartCard">
      <div class="smartCardHead">
        <div><div class="eyebrow">RECENT ACTIVITY</div><h2>最近の自動作成</h2></div>
        <span class="sectionHint">直近8件</span>
      </div>
      <div id="recentAutoRuns" class="activityList">${recentRunsHtml}</div>
    </section>

    

    <details id="articleEditorSection" class="adminFold">
      <summary>✍️ 記事編集・ホテル検索</summary>
      <div class="foldBody">
    <div class="panel" style="margin-top:18px">
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
      <div class="field"><label>画像URL</label><input id="coverImage" class="input" placeholder="https://..."><div id="imagePreview" class="preview">画像URLを入れるとプレビューします</div></div>
      <div class="field"><label>画像alt</label><input id="coverAlt" class="input"></div>
      <div class="field"><label>公開日</label><input id="date" class="input" type="date"><div class="small">未来の日付＋「公開」で、公開予約として扱います。</div></div>
      <div class="field"><label>要約</label><textarea id="excerpt" rows="3"></textarea></div>
      <div class="field"><label>本文（## 見出し / - 箇条書き 対応）</label><textarea id="content" rows="10"></textarea></div>
      <div class="row">
        <div class="field"><label>タグ（カンマ区切り）</label><input id="tags" class="input"></div>
        <div class="field"><label>年齢（カンマ区切り）</label><input id="ageGroups" class="input"></div>
      </div>
      <div class="field"><label>実用情報（カンマ区切り）</label><input id="practical" class="input"></div>
      <h3 id="hotelSearchSection">アフィリエイト・ホテル検索</h3>
      <div class="panel" style="margin:12px 0;background:#f7fbff">
        <h3 style="margin-top:0">🤖 九州ホテル完全自動化</h3>
        <p class="small">九州7県を順番に巡回し、楽天トラベルからファミリー向け候補を検索。評価・口コミを加味して未掲載ホテルを選び、楽天アフィリエイトURL付きの記事を自動公開します。</p>
        <form method="post" action="/admin-auto-create" class="inlineNativeForm">
          <button id="autoHotelRunNativeBtn" class="btn" type="submit">今すぐ1記事を自動作成</button>
        </form>
        <div id="autoHotelStatus" class="small" style="margin-top:10px">${autoResult
          ? (autoResult === "success"
              ? `記事作成完了 ✅ ${esc(autoMessage)}`
              : autoResult === "skip"
                ? `今回はスキップ：${esc(autoMessage)}`
                : `記事作成エラー：${esc(autoMessage)}`)
          : `準備完了。ボタンを押すと1記事作成します。`}</div>
      </div>
      <div id="hotel-search" class="panel" style="margin:12px 0;background:#fbfffd">
        <h3 style="margin-top:0">🟥 楽天ホテル検索</h3>
        <p class="small">ホテル名を入力 → 楽天トラベルAPIで検索 → 候補選択 → 記事作成まで、JavaScriptに依存せず実行します。</p>

        <form method="get" action="/admin.html" class="nativeHotelSearchForm">
          <div class="row">
            <div class="field"><input name="hotelSearch" class="input" placeholder="例：杉乃井ホテル" value="${esc(hotelSearchKeyword)}" required minlength="2"></div>
            <div class="field"><button class="btn" type="submit">楽天で検索</button></div>
          </div>
        </form>

        ${hotelSearchError ? `<div class="smartNotice errorNotice">検索エラー：${esc(hotelSearchError)}</div>` : ""}
        ${hotelSearchData ? `<div class="small" style="margin:10px 0">${hotelSearchData.count || 0}件見つかりました。${hotelSearchData.affiliateEnabled ? " アフィリエイトURL対応済み。" : ""}</div>` : ""}
        ${hotelSearchResultsHtml}
        ${selectedHotelHtml}
        ${hotelCreateResult ? `<div class="smartNotice ${hotelCreateResult === "success" ? "" : "errorNotice"}" style="margin-top:12px">${hotelCreateResult === "success" ? `記事作成完了 ✅ ${esc(hotelCreateMessage)}${hotelCreateArticleUrl ? ` <a href="${esc(hotelCreateArticleUrl)}" target="_blank">公開記事を見る</a>` : ""}` : `記事作成エラー：${esc(hotelCreateMessage)}`}</div>` : ""}
      </div>
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
      <div class="btns"><button id="saveBtn" class="btn" type="button">保存</button><button id="newBtn" class="btn sub" type="button">新規入力</button></div>
      <div id="saveStatus" class="status">準備完了</div>
    </div>
      </div>
    </details>

    <section id="articleListSection" class="smartCard adminSection">
      <div class="smartCardHead">
        <div><div class="eyebrow">CONTENT</div><h2>記事一覧</h2><div class="sectionHint">article list v8.3.0</div></div>
        <div class="miniActions" style="margin-top:0"><button class="btn sub" type="button" onclick="location.reload()">↻ 再読み込み</button><button id="newArticleTopBtn" class="btn sub" type="button">＋ 新規記事</button></div>
      </div>
      ${deleteResult ? `<div class="smartNotice ${deleteResult === "success" ? "" : "errorNotice"}" style="margin-bottom:12px">${deleteResult === "success" ? `削除しました ✅ ${esc(deleteMessage)}` : deleteResult === "notfound" ? "記事が見つかりませんでした。" : `削除エラー：${esc(deleteMessage)}`}</div>` : ""}
      <div id="articleList">${adminArticlesHtml}</div>
    </section>
  </main>
<script>
window.__SERVER_AUTHED__ = ${serverAuthed ? "true" : "false"};

function dashEsc(v){
  return String(v==null?"":v).replace(/[&<>"']/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
function dashFmtDate(v){
  if(!v) return "未実行";
  try{
    return new Intl.DateTimeFormat("ja-JP",{timeZone:"Asia/Tokyo",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(v));
  }catch(e){return String(v);}
}
async function dashboardLoadDirect(){
  var pw=sessionStorage.getItem("adminPassword")||"";
  var articleEl=document.getElementById("statArticles");
  var affEl=document.getElementById("statAffiliate");
  var successEl=document.getElementById("statAutoSuccess");
  var badge=document.getElementById("autoStatusBadge");
  var status=document.getElementById("dashAutoStatus");
  var recent=document.getElementById("recentAutoRuns");
  if(!articleEl||!affEl||!successEl||!badge||!status||!recent) return;

  articleEl.textContent="…";
  affEl.textContent="…";
  successEl.textContent="…";
  badge.className="statusBadge";
  badge.textContent="読込中";
  status.textContent="ダッシュボード情報を取得中...";

  var controller=new AbortController();
  var timer=setTimeout(function(){controller.abort();},10000);
  try{
    var r=await fetch("/api/admin-dashboard",{
      cache:"no-store",
      signal:controller.signal,
      headers:{"x-admin-password":pw}
    });
    var text=await r.text();
    var d={};
    try{d=text?JSON.parse(text):{};}catch(e){d={raw:text};}

    if(!r.ok){
      throw new Error("HTTP "+r.status+" / "+(d.error||d.raw||"取得失敗"));
    }

    articleEl.textContent=Number(d.articles&&d.articles.published||0);
    affEl.textContent=Number(d.articles&&d.articles.affiliateCount||0);
    successEl.textContent=Number(d.automation&&d.automation.successRuns||0);

    var last=d.automation&&d.automation.last;
    if(last){
      var cls=last.status==="error"?" error":last.status==="skip"?" skip":"";
      badge.className="statusBadge"+cls;
      badge.textContent=last.status==="success"?"成功":last.status==="error"?"エラー":last.status==="skip"?"スキップ":String(last.status||"完了");
      status.innerHTML="<b>"+dashEsc(last.hotelName||"自動処理")+"</b><br>"+
        "最終実行："+dashEsc(dashFmtDate(last.runAt))+
        (last.prefecture?" / "+dashEsc(last.prefecture):"")+
        (last.message?"<br>"+dashEsc(last.message):"")+
        "<br>次回予定：毎朝6:10 JST";
    }else{
      badge.className="statusBadge";
      badge.textContent=d.partial?"一部取得":"正常";
      status.innerHTML=d.partial&&d.warnings&&d.warnings.length
        ? "一部データのみ取得："+dashEsc(d.warnings.join(" / "))
        : "<b>自動実行の準備は完了しています。</b><br>次回予定：毎朝6:10 JST";
    }

    var rows=d.automation&&d.automation.recent||[];
    recent.innerHTML=rows.length?rows.map(function(x){
      var cls=x.status==="error"?" error":x.status==="skip"?" skip":"";
      return '<div class="activityItem">'+
        '<span class="activityDot'+cls+'"></span>'+
        '<div><div class="activityTitle">'+dashEsc(x.hotelName||x.message||"自動処理")+'</div>'+
        '<div class="activityMeta">'+dashEsc(dashFmtDate(x.runAt))+
        (x.prefecture?' ・ '+dashEsc(x.prefecture):'')+'</div></div>'+
        '<div class="activityState">'+dashEsc(x.status||"")+'</div></div>';
    }).join(""):'<div class="smartNotice">まだ自動作成履歴はありません。</div>';

    var directMark=document.getElementById("directDashVersion");
    if(directMark) directMark.textContent="データ取得OK";
  }catch(e){
    articleEl.textContent="!";
    affEl.textContent="!";
    successEl.textContent="!";
    badge.className="statusBadge error";
    badge.textContent="取得エラー";
    status.textContent="ダッシュボード取得エラー："+(e&&e.name==="AbortError"?"10秒でタイムアウト":(e&&e.message?e.message:"不明なエラー"));
    recent.innerHTML='<div class="smartNotice">ダッシュボード取得に失敗しました。</div>';
  }finally{
    clearTimeout(timer);
  }
}


async function articleListLoadDirect(){
  var box=document.getElementById("articleList");
  if(!box) return;

  box.innerHTML='<div class="smartNotice">記事一覧を読み込み中...</div>';

  var controller=new AbortController();
  var timer=setTimeout(function(){controller.abort();},10000);

  try{
    var r=await fetch("/api/articles?published=0&_="+Date.now(),{
      cache:"no-store",
      signal:controller.signal
    });

    var text=await r.text();
    var d={};
    try{ d=text?JSON.parse(text):{}; }catch(e){ d={raw:text}; }

    if(!r.ok){
      throw new Error("HTTP "+r.status+" / "+(d.error||d.raw||"取得失敗"));
    }

    var rows=Array.isArray(d.articles)?d.articles:[];
    if(!rows.length){
      box.innerHTML='<div class="smartNotice">記事はまだありません。</div>';
      return;
    }

    box.innerHTML=rows.map(function(a){
      var published=!!a.published;
      var affiliate=!!(a.affiliate && a.affiliate.rakuten);
      var state=published?"公開":"下書き";
      var date=a.updatedAt||a.date||"";
      return '<div class="contentRow">'+
        '<div class="contentMain">'+
          '<div class="contentTitle">'+dashEsc(a.title||"無題")+'</div>'+
          '<div class="contentMeta">'+
            '<span class="miniBadge '+(published?'ok':'')+'">'+state+'</span>'+
            (affiliate?'<span class="miniBadge affiliate">楽天リンクあり</span>':'')+
            (date?'<span>'+dashEsc(date)+'</span>':'')+
          '</div>'+
        '</div>'+
        '<div class="contentActions">'+
          '<a class="btn sub" target="_blank" href="/article.html?id='+encodeURIComponent(a.id||"")+'">表示</a>'+
          '<button class="btn sub" type="button" onclick="articleEditDirect('+JSON.stringify(String(a.id||""))+')">編集</button>'+
          '<button class="btn dangerBtn" type="button" onclick="articleDeleteDirect('+JSON.stringify(String(a.id||""))+','+JSON.stringify(String(a.title||""))+')">削除</button>'+
        '</div>'+
      '</div>';
    }).join("");

  }catch(e){
    box.innerHTML='<div class="smartNotice errorNotice"><b>記事一覧取得エラー</b><br>'+
      dashEsc(e&&e.name==="AbortError"?"10秒でタイムアウトしました":(e&&e.message?e.message:"不明なエラー"))+
      '<br><button class="btn sub" type="button" onclick="articleListLoadDirect()" style="margin-top:10px">再読み込み</button></div>';
  }finally{
    clearTimeout(timer);
  }
}




async function articleDeleteDirect(id,title){
  if(!id) return;
  if(!confirm("この記事を削除します。\n\n"+(title||id)+"\n\nこの操作は元に戻せません。")) return;

  try{
    var pw=sessionStorage.getItem("adminPassword")||"";
    var r=await fetch("/api/articles",{
      method:"DELETE",
      cache:"no-store",
      headers:{
        "content-type":"application/json",
        "x-admin-password":pw
      },
      body:JSON.stringify({id:id})
    });
    var text=await r.text();
    var d={};
    try{d=text?JSON.parse(text):{};}catch(e){d={raw:text};}
    if(!r.ok) throw new Error(d.error||d.raw||("HTTP "+r.status));

    alert("削除しました");
    await articleListLoadDirect();
    if(typeof dashboardLoadDirect==="function") dashboardLoadDirect();
  }catch(e){
    alert("削除に失敗しました: "+(e&&e.message?e.message:"不明なエラー"));
  }
}

async function articleEditDirect(id){
  var details=document.getElementById("articleEditorSection");
  if(details) details.open=true;

  try{
    var r=await fetch("/api/articles?id="+encodeURIComponent(id)+"&_="+Date.now(),{cache:"no-store"});
    var d=await r.json();
    var a=(d.articles||[])[0];
    if(!a) throw new Error("記事が見つかりません");

    function setv(id,v){var el=document.getElementById(id);if(el)el.value=v==null?"":v;}
    function setc(id,v){var el=document.getElementById(id);if(el)el.checked=!!v;}

    setv("id",a.id); setv("title",a.title); setv("icon",a.icon||"🧳");
    setv("area",a.area||"fukuoka"); setv("category",a.category||"spot"); setv("date",a.date||"");
    setv("coverImage",a.coverImage||""); setv("coverAlt",a.coverAlt||"");
    setv("excerpt",a.excerpt||""); setv("content",a.content||"");
    setv("tags",(a.tags||[]).join(", ")); setv("ageGroups",(a.ageGroups||[]).join(", "));
    setv("practical",(a.practical||[]).join(", "));
    setv("rakuten",(a.affiliate&&a.affiliate.rakuten)||"");
    setv("jalan",(a.affiliate&&a.affiliate.jalan)||"");
    setv("yahoo",(a.affiliate&&a.affiliate.yahoo)||"");
    setv("metaDescription",(a.seo&&a.seo.metaDescription)||"");
    setv("keywords",(a.seo&&a.seo.keywords)||"");
    setc("published",a.published); setc("featured",a.featured);

    if(details){
      setTimeout(function(){details.scrollIntoView({behavior:"smooth",block:"start"});},80);
    }
  }catch(e){
    alert("記事編集の読み込みに失敗しました: "+(e&&e.message?e.message:"不明なエラー"));
  }
}


async function autoHotelCreateDirect(buttonId){
  var btn=document.getElementById(buttonId||"dashAutoRunBtn");
  var topStatus=document.getElementById("dashAutoStatus");
  var lowerStatus=document.getElementById("autoHotelStatus");
  var pw=sessionStorage.getItem("adminPassword")||"";

  if(btn){
    btn.disabled=true;
    btn.dataset.originalText=btn.textContent;
    btn.textContent="作成中...";
  }
  if(topStatus) topStatus.textContent="九州のおすすめホテルを検索して記事を自動作成しています...";
  if(lowerStatus) lowerStatus.textContent="九州のおすすめホテルを検索して記事を自動作成しています...";

  try{
    var controller=new AbortController();
    var timer=setTimeout(function(){controller.abort();},45000);
    var r;
    try{
      r=await fetch("/api/auto-hotel",{
        method:"POST",
        cache:"no-store",
        signal:controller.signal,
        headers:{"x-admin-password":pw}
      });
    }finally{
      clearTimeout(timer);
    }

    var text=await r.text();
    var d={};
    try{d=text?JSON.parse(text):{};}catch(e){d={raw:text};}
    if(!r.ok) throw new Error(d.error||d.raw||("HTTP "+r.status));

    var msg=d.skipped
      ? "今回はスキップ："+(d.reason||"候補なし")
      : "自動作成完了 ✅ "+(d.hotelName||"");

    if(topStatus){
      topStatus.innerHTML=d.skipped
        ? dashEsc(msg)
        : dashEsc(msg)+' <a href="'+dashEsc(d.url||"#")+'" target="_blank">記事を見る</a>';
    }
    if(lowerStatus){
      lowerStatus.innerHTML=d.skipped
        ? dashEsc(msg)
        : dashEsc(msg)+' <a href="'+dashEsc(d.url||"#")+'" target="_blank">記事を見る</a>';
    }

    if(typeof dashboardLoadDirect==="function") dashboardLoadDirect();
    if(typeof articleListLoadDirect==="function") articleListLoadDirect();

  }catch(e){
    var msg="自動作成エラー："+(e&&e.name==="AbortError"?"45秒でタイムアウトしました":(e&&e.message?e.message:"不明なエラー"));
    if(topStatus) topStatus.textContent=msg;
    if(lowerStatus) lowerStatus.textContent=msg;
  }finally{
    if(btn){
      btn.disabled=false;
      btn.textContent=btn.dataset.originalText||"今すぐ1記事作成";
    }
  }
}

async function adminLoginDirect(){
  var btn=document.getElementById("loginBtn");
  var status=document.getElementById("loginStatus");
  var input=document.getElementById("pw");
  var loginBox=document.getElementById("loginBox");
  var adminApp=document.getElementById("adminApp");
  if(!btn||!status||!input||!loginBox||!adminApp) return;
  var pw=input.value||"";
  status.textContent="確認中...";
  btn.disabled=true;
  try{
    var r=await fetch("/api/articles?auth=1",{cache:"no-store",headers:{"x-admin-password":pw}});
    if(r.ok){
      sessionStorage.setItem("adminPassword",pw);
      loginBox.style.display="none";
      adminApp.style.display="block";
      status.textContent="ログイン成功";
      dashboardLoadDirect();
      articleListLoadDirect();
      window.dispatchEvent(new CustomEvent("admin-direct-login",{detail:{password:pw}}));
    }else{
      status.textContent="パスワードが違います。（HTTP "+r.status+"）";
    }
  }catch(e){
    status.textContent="通信エラー: "+(e&&e.message?e.message:"接続できませんでした");
  }finally{
    btn.disabled=false;
  }
}
document.addEventListener("DOMContentLoaded",function(){
  // v7.6.0: 初期表示はサーバー描画。自動fetchで上書きしない。
  var input=document.getElementById("pw");
  if(input){
    input.addEventListener("keydown",function(e){
      if(e.key==="Enter"){ e.preventDefault(); adminLoginDirect(); }
    });
  }
});
</script>
<script>


function githubFileNameDirect(input){
  var out=document.getElementById("githubFileName");
  var status=document.getElementById("githubUploadStatus");
  var btn=document.getElementById("githubZipUploadBtn");
  var file=input && input.files && input.files[0];
  if(file){
    if(out) out.textContent=file.name;
    if(status) status.textContent="選択済み："+file.name;
    if(btn) btn.disabled=false;
  }else{
    if(out) out.textContent="未選択";
    if(status) status.textContent="ZIPを選択してください。";
  }
}

async function githubZipFormSubmit(ev){
  ev.preventDefault();
  var form=document.getElementById("githubZipForm");
  var input=document.getElementById("githubZipInput");
  var btn=document.getElementById("githubZipUploadBtn");
  var status=document.getElementById("githubUploadStatus");
  if(!input || !input.files || !input.files[0]){
    status.textContent="ZIPを選択してください。";
    return false;
  }

  if(!confirm(input.files[0].name+" をGitHubへ反映します。よろしいですか？")) return false;

  btn.disabled=true;
  status.textContent="GitHubへ反映中...";

  try{
    var fd=new FormData();
    fd.append("zipfile",input.files[0],input.files[0].name);

    var pw=sessionStorage.getItem("adminPassword")||"";
    var r=await fetch("/api/github-zip-form",{
      method:"POST",
      headers:{"x-admin-password":pw},
      body:fd
    });

    var text=await r.text();
    var d={};
    try{d=text?JSON.parse(text):{};}catch(e){d={raw:text};}

    if(r.ok || r.status===207){
      if(d.failed===0){
        status.innerHTML="<b>GitHub反映完了 ✅</b><br>"+d.success+"ファイルを更新しました。";
      }else{
        status.innerHTML="<b>一部失敗</b><br>成功 "+d.success+" / 失敗 "+d.failed+
          "<br>"+dashEsc((d.results||[]).filter(function(x){return !x.ok;}).slice(0,5).map(function(x){return x.path+": "+x.error;}).join(" / "));
      }
    }else{
      status.textContent="反映失敗: HTTP "+r.status+" / "+(d.error||d.raw||"不明なエラー");
    }
  }catch(e){
    status.textContent="通信エラー: "+(e&&e.message?e.message:"不明なエラー");
  }finally{
    btn.disabled=false;
  }
  return false;
}

async function githubCheckDirect(){
  var badge=document.getElementById("githubStatusBadge");
  var status=document.getElementById("githubUploadStatus");
  var btn=document.getElementById("githubCheckBtn");
  if(!badge||!status||!btn) return;

  var pw=sessionStorage.getItem("adminPassword")||"";
  badge.className="statusBadge";
  badge.textContent="確認中";
  status.textContent="GitHubへ接続確認中...";
  btn.disabled=true;

  try{
    var controller=new AbortController();
    var timer=setTimeout(function(){controller.abort();},10000);
    var r;
    try{
      r=await fetch("/api/github-status",{
        cache:"no-store",
        signal:controller.signal,
        headers:{"x-admin-password":pw}
      });
    }finally{
      clearTimeout(timer);
    }
    var text=await r.text();
    var d={};
    try{ d=text?JSON.parse(text):{}; }catch(e){ d={raw:text}; }

    if(r.ok && d.ok){
      badge.className="statusBadge";
      badge.textContent="接続済み";
      status.textContent="GitHub接続OK："+(d.repositoryName||d.repository||"yuuji0628/kyushu-family-trip-navi");
    }else{
      badge.className="statusBadge error";
      badge.textContent=d.configured===false?"TOKEN未設定":"接続エラー";
      status.textContent="HTTP "+r.status+" / "+(d.error||d.details||d.raw||"GitHub接続に失敗しました");
    }
  }catch(e){
    badge.className="statusBadge error";
    badge.textContent="通信エラー";
    status.textContent="接続確認エラー: "+(e&&e.name==="AbortError"?"10秒でタイムアウトしました":(e&&e.message?e.message:"不明なエラー"));
  }finally{
    btn.disabled=false;
  }
}
</script>
<script>
var directGithubZipFiles=[];












</script>
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
    if(!password) return;
    try{
      if(await auth(password)){
        $("loginBox").style.display="none";
        $("adminApp").style.display="block";
        loadArticles();
        loadDashboard();
          }else{
        sessionStorage.removeItem("adminPassword");
        password="";
      }
    }catch(e){
      $("loginStatus").textContent="自動ログイン確認に失敗しました。手動でログインしてください。";
    }
  }
  window.addEventListener("admin-direct-login",function(e){
    password=(e.detail&&e.detail.password)||sessionStorage.getItem("adminPassword")||"";
    loadArticles();
    loadDashboard();
    checkGithubConnection();
  });
  $("logoutBtn").onclick = function(){ sessionStorage.removeItem("adminPassword"); location.reload(); };
  function csv(v){ return v.split(",").map(function(x){return x.trim();}).filter(Boolean); }

  var githubZipFiles=[];

  async function checkGithubConnection(){
    $("githubStatusBadge").className="statusBadge";
    $("githubStatusBadge").textContent="確認中";
    try{
      var r=await fetch("/api/github-status",{headers:headers()});
      var d=await r.json().catch(function(){return {};});
      if(r.ok && d.ok){
        $("githubStatusBadge").textContent="接続済み";
        $("githubUploadStatus").textContent="GitHub接続OK："+(d.repositoryName||d.repository);
        return true;
      }
      $("githubStatusBadge").className="statusBadge error";
      $("githubStatusBadge").textContent=d.configured===false?"未設定":"接続エラー";
      $("githubUploadStatus").textContent=d.error||"GitHub接続に失敗しました。";
      return false;
    }catch(e){
      $("githubStatusBadge").className="statusBadge error";
      $("githubStatusBadge").textContent="接続エラー";
      $("githubUploadStatus").textContent="GitHub接続確認に失敗しました。";
      return false;
    }
  }

  function commonTopFolder(paths){
    var clean=paths.filter(Boolean).map(function(p){return p.replace(/^\/+/,"");});
    if(!clean.length) return "";
    var first=clean[0].split("/")[0];
    if(!first) return "";
    return clean.every(function(p){return p===first || p.startsWith(first+"/");}) ? first+"/" : "";
  }

  function u8ToBase64(bytes){
    var binary="";
    var chunk=0x8000;
    for(var i=0;i<bytes.length;i+=chunk){
      binary+=String.fromCharCode.apply(null, bytes.subarray(i,Math.min(i+chunk,bytes.length)));
    }
    return btoa(binary);
  }

  async function inflateRaw(bytes){
    if(typeof DecompressionStream==="undefined"){
      throw new Error("このブラウザではZIP展開機能を利用できません。iOS/Safariを最新版にしてください。");
    }
    var ds=new DecompressionStream("deflate-raw");
    var stream=new Blob([bytes]).stream().pipeThrough(ds);
    var buf=await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  }

  async function parseZipFile(file){
    var buf=await file.arrayBuffer();
    var view=new DataView(buf);
    var bytes=new Uint8Array(buf);
    var decoder=new TextDecoder("utf-8");
    var pos=0, entries=[];

    while(pos+30<=view.byteLength){
      var sig=view.getUint32(pos,true);
      if(sig===0x04034b50){
        var flags=view.getUint16(pos+6,true);
        var method=view.getUint16(pos+8,true);
        var compSize=view.getUint32(pos+18,true);
        var uncompSize=view.getUint32(pos+22,true);
        var nameLen=view.getUint16(pos+26,true);
        var extraLen=view.getUint16(pos+28,true);

        if(flags & 0x08){
          throw new Error("このZIP形式は未対応です。ChatGPTから受け取ったZIPをそのまま使用してください。");
        }

        var nameStart=pos+30;
        var dataStart=nameStart+nameLen+extraLen;
        if(dataStart+compSize>view.byteLength) throw new Error("ZIPデータが壊れています。");

        var name=decoder.decode(bytes.slice(nameStart,nameStart+nameLen));
        var compressed=bytes.slice(dataStart,dataStart+compSize);
        var output;

        if(method===0){
          output=compressed;
        }else if(method===8){
          output=await inflateRaw(compressed);
        }else{
          throw new Error("未対応のZIP圧縮方式です: "+method);
        }

        if(uncompSize && output.length!==uncompSize){
          throw new Error("ZIP展開サイズが一致しません: "+name);
        }

        if(!name.endsWith("/")){
          entries.push({name:name,bytes:output});
        }
        pos=dataStart+compSize;
        continue;
      }

      if(sig===0x02014b50 || sig===0x06054b50) break;
      pos++;
    }

    if(!entries.length) throw new Error("ZIP内にファイルが見つかりません。");
    return entries;
  }

  // ZIP input handled by independent direct uploader.

  // ZIP upload handled by independent direct uploader.

  function fmtDateTime(v){
    if(!v) return "未実行";
    try{
      var d=new Date(v);
      return new Intl.DateTimeFormat("ja-JP",{timeZone:"Asia/Tokyo",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(d);
    }catch(e){ return v; }
  }

  function autoStateLabel(s){
    if(s==="success") return "成功";
    if(s==="error") return "エラー";
    if(s==="skip") return "スキップ";
    return s||"未実行";
  }

  async function loadDashboard(){
    try{
      var r=await fetchWithTimeout("/api/admin-dashboard",{headers:headers(),cache:"no-store"},10000);
      var d=await r.json().catch(function(){return {};});
      if(!r.ok) throw new Error(d.error||("HTTP "+r.status));

      $("statArticles").textContent=d.articles?.published ?? 0;
      $("statAffiliate").textContent=d.articles?.affiliateCount ?? 0;
      $("statAutoSuccess").textContent=d.automation?.successRuns ?? 0;

      if(d.partial && d.warnings && d.warnings.length){
        $("dashAutoStatus").innerHTML='<div class="smartNotice">一部データのみ取得しました：'+escapeHtmlClient(d.warnings.join(" / "))+'</div>';
      }

      var last=d.automation?.last;
      var badge=$("autoStatusBadge");
      badge.className="statusBadge"+(last?.status==="error"?" error":last?.status==="skip"?" skip":"");
      badge.textContent=autoStateLabel(last?.status);

      var integrations=d.integrations||{};
      var apiOk=integrations.rakutenApplicationId&&integrations.rakutenAccessKey&&integrations.rakutenAffiliateId;
      if(!last && !d.partial){
        $("dashAutoStatus").innerHTML=
          '<b>自動実行の準備は完了しています。</b><br>'+
          '次回予定：毎朝6:10 JST / 楽天API：'+(apiOk?"接続設定済み":"設定確認が必要");
      }else if(last){
        $("dashAutoStatus").innerHTML=
          '<b>'+escapeHtmlClient(last.hotelName||"自動処理")+'</b><br>'+
          '最終実行：'+escapeHtmlClient(fmtDateTime(last.runAt))+
          ' / '+escapeHtmlClient(autoStateLabel(last.status))+
          (last.prefecture?' / '+escapeHtmlClient(last.prefecture):'')+
          (last.message?'<br>'+escapeHtmlClient(last.message):'')+
          '<br>次回予定：毎朝6:10 JST';
      }

      var recent=d.automation?.recent||[];
      $("recentAutoRuns").innerHTML=recent.length?recent.map(function(x){
        var cls=x.status==="error"?" error":x.status==="skip"?" skip":"";
        var title=x.hotelName||x.message||"自動処理";
        var article=x.articleId?('<a href="/article.html?id='+encodeURIComponent(x.articleId)+'" target="_blank">記事を見る</a>'):"";
        return '<div class="activityItem">'+
          '<span class="activityDot'+cls+'"></span>'+
          '<div><div class="activityTitle">'+escapeHtmlClient(title)+'</div>'+
          '<div class="activityMeta">'+escapeHtmlClient(fmtDateTime(x.runAt))+
          (x.prefecture?' ・ '+escapeHtmlClient(x.prefecture):'')+
          (x.keyword?' ・ '+escapeHtmlClient(x.keyword):'')+'</div></div>'+
          '<div class="activityState">'+escapeHtmlClient(autoStateLabel(x.status))+(article?' ・ '+article:'')+'</div>'+
          '</div>';
      }).join(""):'<div class="smartNotice">まだ自動作成履歴はありません。最初の実行後にここへ表示されます。</div>';
    }catch(e){
      $("autoStatusBadge").className="statusBadge error";
      $("autoStatusBadge").textContent="確認失敗";
      $("dashAutoStatus").textContent="ダッシュボード取得エラー："+(e.name==="AbortError"?"10秒でタイムアウトしました":e.message);
      $("recentAutoRuns").innerHTML='<div class="smartNotice">情報取得に失敗しました。上の「更新」を押すと再試行できます。</div>';
    }
  }

  async function runAutoFromDashboard(){
    var btn=$("dashAutoRunBtn");
    btn.disabled=true;
    btn.textContent="作成中...";
    $("dashAutoStatus").textContent="九州のおすすめホテルを検索して記事を自動作成しています...";
    try{
      var r=await fetch("/api/auto-hotel",{method:"POST",headers:headers()});
      var d=await r.json().catch(function(){return {};});
      if(!r.ok) throw new Error(d.error||("HTTP "+r.status));
      if(d.skipped){
        $("dashAutoStatus").textContent="今回はスキップ："+(d.reason||"候補なし");
      }else{
        $("dashAutoStatus").innerHTML='作成完了 ✅ <b>'+escapeHtmlClient(d.hotelName||"")+'</b> <a href="'+d.url+'" target="_blank">記事を見る</a>';
      }
      await loadDashboard();
      await loadArticles();
    }catch(e){
      $("dashAutoStatus").textContent="自動作成エラー："+e.message;
      await loadDashboard();
    }
    btn.disabled=false;
    btn.textContent="今すぐ1記事作成";
  }

  if ($("dashAutoRunBtn")) $("dashAutoRunBtn").onclick=runAutoFromDashboard;
  if ($("dashRefreshBtn")) $("dashRefreshBtn").onclick=function(){ loadDashboard(); loadArticles(); };
  if ($("jumpHotelSearch")) $("jumpHotelSearch").onclick=function(){
    $("articleEditorSection").open=true;
    setTimeout(function(){ $("hotelSearchSection").scrollIntoView({behavior:"smooth",block:"start"}); },50);
  };
  if ($("jumpArticleEditor")) $("jumpArticleEditor").onclick=function(){
    $("articleEditorSection").open=true;
    setTimeout(function(){ $("articleEditorSection").scrollIntoView({behavior:"smooth",block:"start"}); },50);
  };
  if ($("jumpArticleList")) $("jumpArticleList").onclick=function(){ $("articleListSection").scrollIntoView({behavior:"smooth",block:"start"}); };
  if ($("jumpGithubZip")) $("jumpGithubZip").onclick=function(){ $("githubZipSection").scrollIntoView({behavior:"smooth",block:"start"}); };
  if ($("newArticleTopBtn")) $("newArticleTopBtn").onclick=function(){
    $("articleEditorSection").open=true;
    $("newBtn").click();
    setTimeout(function(){ $("articleEditorSection").scrollIntoView({behavior:"smooth",block:"start"}); },50);
  };


  async function loadArticles(){
    var r = await fetch("/api/articles");
    var d = await r.json();
    var list = d.articles || [];
    $("articleList").innerHTML = list.length ? list.map(function(a){
      var today=new Date().toISOString().slice(0,10); var state=!a.published?'下書き':(a.date&&a.date>today?'公開予約 '+a.date:'公開');
      return '<div style="padding:14px 0;border-bottom:1px solid #d8e6df"><b>'+a.title+'</b><div class="small">'+a.area+' / '+a.category+' / '+state+'</div><button class="btn sub editBtn" data-id="'+a.id+'">編集</button> <button class="btn sub delBtn" data-id="'+a.id+'">削除</button></div>';
    }).join("") : "記事がありません。";
    Array.from(document.querySelectorAll(".editBtn")).forEach(function(b){ b.onclick=function(){ editArticle(b.dataset.id); }; });
    Array.from(document.querySelectorAll(".delBtn")).forEach(function(b){ b.onclick=function(){ deleteArticle(b.dataset.id); }; });
  }
  async function editArticle(id){
    var r=await fetch("/api/articles?id="+encodeURIComponent(id)); var d=await r.json(); var a=(d.articles||[])[0]; if(!a)return;
    $("id").value=a.id||""; $("title").value=a.title||""; $("icon").value=a.icon||"🧳"; $("area").value=a.area||"fukuoka"; $("category").value=a.category||"spot"; $("date").value=a.date||"";
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
      date:$("date").value||undefined,published:$("published").checked,featured:$("featured").checked};
  }
  if ($("saveBtn")) $("saveBtn").onclick=async function(){
    var p=payload(); var method=p.id?"PUT":"POST"; $("saveStatus").textContent="保存中...";
    var r=await fetch("/api/articles",{method:method,headers:headers(),body:JSON.stringify(p)});
    var d=await r.json().catch(function(){return {};});
    if(!r.ok){$("saveStatus").textContent="保存失敗: HTTP "+r.status+" "+(d.error||"");return;}
    $("saveStatus").textContent="保存しました。公開サイトへ即時反映されます。"; clearForm(); loadArticles();
  };
  if ($("newBtn")) $("newBtn").onclick=clearForm;
  function clearForm(){ ["id","title","coverImage","coverAlt","excerpt","content","tags","ageGroups","practical","rakuten","jalan","yahoo","metaDescription","keywords"].forEach(function(x){$(x).value="";}); $("date").value=new Date().toISOString().slice(0,10); $("icon").value="🧳"; $("published").checked=true; $("featured").checked=false; updatePreview(); }
  function updatePreview(){var u=$("coverImage").value.trim();$("imagePreview").innerHTML=u?'<img src="'+u.replace(/"/g,"&quot;")+'" alt="プレビュー">':'画像URLを入れるとプレビューします';}
  if ($("coverImage")) $("coverImage").addEventListener("input",updatePreview);
  async function deleteArticle(id){
    if(!confirm("この記事を削除しますか？")) return;
    var r=await fetch("/api/articles",{method:"DELETE",headers:headers(),body:JSON.stringify({id:id})});
    if(r.ok) loadArticles(); else alert("削除に失敗しました");
  }
  // 旧品質アップデート用ハンドラを完全削除。
  // v7.7.1: 楽天ホテル検索はNativeフォーム化済み。

  function escapeHtmlClient(v){
    return String(v||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});
  }

  if(!$("date").value) $("date").value=new Date().toISOString().slice(0,10);
  boot();
})();
</script>`;
  return html(layout("管理画面｜九州ファミリー旅ナビ", body, '<meta name="robots" content="noindex,nofollow">'));
}


async function sitemapPage(env, url) {
  const rows = await listArticles(env.DB, { published: true });
  const urls = [
    `<url><loc>${esc(url.origin + "/")}</loc><changefreq>daily</changefreq></url>`,
    `<url><loc>${esc(url.origin + "/articles.html")}</loc><changefreq>daily</changefreq></url>`,
    `<url><loc>${esc(url.origin + "/editorial-policy.html")}</loc><changefreq>monthly</changefreq></url>`,
    ...rows.map(a => `<url><loc>${esc(url.origin + "/article.html?id=" + encodeURIComponent(a.id))}</loc><lastmod>${esc(a.updatedAt || a.date || todayJst())}</lastmod><changefreq>weekly</changefreq></url>`)
  ];
  for (const areaKey of Object.keys(AREA_LABELS)) {
    const areaRows = rows.filter(a => a.area === areaKey);
    for (const theme of Object.keys(SEO_THEME_CONFIG)) {
      if (areaRows.some(a => articleMatchesTheme(a,theme))) {
        urls.push(`<url><loc>${esc(url.origin + seoHubUrl(areaKey,theme))}</loc><lastmod>${todayJst()}</lastmod><changefreq>weekly</changefreq></url>`);
      }
    }
  }
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`, {
    headers: { "content-type":"application/xml; charset=utf-8" }
  });
}

function robotsPage(url) {
  return new Response(`User-agent: *\\nAllow: /\\nDisallow: /admin.html\\nSitemap: ${url.origin}/sitemap.xml\\n`, {
    headers: { "content-type":"text/plain; charset=utf-8" }
  });
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        await autoCreateKyushuHotelArticle(env);
      } catch (e) {
        if (env.DB) {
          try {
            await writeAutoHotelLog(env.DB, {
              status:"error",
              message:"Scheduled run failed: " + String(e?.message || e)
            });
          } catch {}
        }
      }
    })());
  },

  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/articles") return await handleApi(request, env);
      if (url.pathname === "/api/rakuten-hotels") return await handleRakutenHotelSearch(request, env);
      if (url.pathname === "/api/suginoi-article") return await createSuginoiArticle(request, env);
      if (url.pathname === "/api/hotel-article") return await createGenericHotelArticle(request, env);
      if (url.pathname === "/api/auto-hotel") return await handleAutoHotelApi(request, env);
      if (url.pathname === "/api/admin-dashboard") return await handleAdminDashboard(request, env);
      if (url.pathname === "/api/github-status") return await handleGithubStatus(request, env);
      if (url.pathname === "/api/github-file") return await handleGithubFileUpload(request, env);
      if (url.pathname === "/api/github-zip-form") return await handleGithubZipForm(request, env);
      if (url.pathname === "/api/premium-articles") return await upgradePremiumArticles(request, env);
      if (url.pathname === "/__diag") {
        if (!env.DB) return json({ ok: false, error: "D1 binding DB is not configured" }, { status: 500 });
        const rows = await listArticles(env.DB, { featured: true, published: true });
        return json({ ok: true, storage: "d1", featuredCount: rows.length, ids: rows.map(x => x.id) });
      }
      if (url.pathname === "/" || url.pathname === "/index.html") return await homePage(env, url);
      if (url.pathname === "/media/article-image") return await articleFreshImage(request, env);
      if (url.pathname === "/media/image-fingerprint") return await imageFingerprint(request, env);
      if (url.pathname === "/media/image") return await articleImageProxy(request);
      if (url.pathname === "/articles.html") return await articlesPage(env, url);
      if (url.pathname.startsWith("/guide/")) return await seoGuidePage(env, url);
      if (url.pathname === "/sitemap.xml") return await sitemapPage(env, url);
      if (url.pathname === "/robots.txt") return robotsPage(url);
      if (url.pathname === "/article.html") return await articlePage(env, url);
      if (url.pathname === "/editorial-policy.html") return editorialPolicyPage(url);
      if (url.pathname === "/admin-login") return await handleAdminLogin(request, env);
      if (url.pathname === "/admin-logout") return handleAdminLogout();
      if (url.pathname === "/admin-delete-article") return await handleAdminDeleteArticle(request, env);
      if (url.pathname === "/admin-hotel-article") return await handleAdminHotelArticleCreate(request, env);
      if (url.pathname === "/admin-auto-create") return await handleAdminAutoCreate(request, env);
      if (url.pathname === "/admin.html") return await adminPage(request, env);
      return html(layout("ページが見つかりません", '<main class="article"><h1>404</h1><p>ページが見つかりません。</p></main>'), { status:404 });
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, { status:500 });
    }
  }
};

