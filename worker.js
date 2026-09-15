
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

function markdownLite(src = "") {
  const safe = esc(src);
  return safe
    .replace(/^&gt; POINT: (.+)$/gm, '<div class="editorPoint"><b>編集部ポイント</b><span>$1</span></div>')
    .replace(/^&gt; CHECK: (.+)$/gm, '<div class="checkPoint"><b>予約前チェック</b><span>$1</span></div>')
    .replace(/^&gt; MEMO: (.+)$/gm, '<div class="memoPoint"><b>ひとことメモ</b><span>$1</span></div>')
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<figure class="articlePhoto"><img src="$2" alt="$1" loading="lazy"><figcaption>$1</figcaption></figure>')
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
.footer{background:#16352c;color:#fff;padding:44px 0;margin-top:60px}.footer a{color:#fff}
.filterbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}.filterbar a{padding:8px 12px;border:1px solid var(--line);border-radius:999px;text-decoration:none}.searchbar{display:flex;gap:10px;margin:0 0 22px}.searchbar input{flex:1}
.login{max-width:520px;margin:70px auto;padding:28px;border:1px solid var(--line);border-radius:22px}.input,textarea,select{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font:inherit;background:#fff}.field{margin:14px 0}.admin{max-width:1000px;margin:40px auto;padding:0 20px}.panel{border:1px solid var(--line);border-radius:20px;padding:24px;margin:20px 0}
.admin{max-width:1120px;margin:0 auto;padding:28px 20px 70px}
.adminHero{display:flex;justify-content:space-between;gap:24px;align-items:center;padding:28px;border-radius:26px;background:linear-gradient(135deg,#113e32,#168861);color:#fff;box-shadow:var(--shadow);margin:18px 0 20px}
.adminHero h1{margin:4px 0 8px;font-size:clamp(27px,5vw,42px);line-height:1.15}.adminHero p{margin:0;color:rgba(255,255,255,.82)}
.adminHero .eyebrow{color:#bde8d8}.adminHero .btn{background:#fff;color:#153b31;border-color:#fff}.adminHero .btn.sub{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.35)}
.heroActions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
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
.contentActions{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;position:relative;z-index:20}.contentActions .btn{padding:10px 14px;font-size:13px;min-height:44px;touch-action:manipulation;position:relative;z-index:21}.dangerBtn{background:#fff1f1!important;color:#a52a2a!important;border-color:#efcaca!important}
.errorNotice{border-color:#efd0d0;background:#fff7f7}


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
.articlePhoto img{display:block;width:100%;max-height:520px;object-fit:cover;border-radius:18px;border:1px solid var(--line);background:#f5f7f6}
.articlePhoto figcaption{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.5}
.editorPoint b,.checkPoint b,.memoPoint b{font-size:13px}.editorPoint span,.checkPoint span,.memoPoint span{font-size:15px;line-height:1.7}

@media(max-width:800px){.nav{display:none}.menuBtn{display:block}.grid{grid-template-columns:1fr}.areaGrid{grid-template-columns:repeat(2,1fr)}.hero{padding:48px 0}.heroGrid{grid-template-columns:1fr}.heroPanel{display:none}.section{padding:46px 0}.row{grid-template-columns:1fr}.sectionHead{align-items:start}.brand{font-size:20px}.searchbar{display:grid;grid-template-columns:1fr auto}.rakutenResultCard{grid-template-columns:82px minmax(0,1fr);align-items:start}.rakutenResultImg{width:82px;height:68px}.rakutenResultCard .rakutenUseBtn{grid-column:1/-1;width:100%;margin-top:2px}.rakutenHotelName{font-size:16px}.admin{padding:0 14px}.panel{padding:18px}.affiliateTop a{display:block;text-align:center;margin-right:0}.adminHero{display:block;padding:22px}.heroActions{justify-content:flex-start;margin-top:16px}.statGrid{grid-template-columns:1fr 1fr}.adminGrid2{grid-template-columns:1fr}.quickGrid{grid-template-columns:1fr 1fr}.smartCard{padding:18px}.activityItem{grid-template-columns:auto 1fr}.activityState{grid-column:2}.admin{padding:14px 12px 60px}}
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
  const relatedAll = await listArticles(env.DB, { area:a.area, published:true });
  const related = relatedAll.filter(x => x.id !== a.id).slice(0,3);
  const relatedHtml = related.length ? `<section class="relatedBox"><h2>${esc(area)}の関連記事</h2><div class="relatedGrid">${related.map(x => `<a href="/article.html?id=${encodeURIComponent(x.id)}"><b>${esc(x.title)}</b><span>${esc(x.excerpt || "")}</span></a>`).join("")}</div></section>` : "";
  const authorBox = `<section class="authorBox"><b>九州ファミリー旅ナビ編集部</b><p>公開情報を確認し、子連れ旅行での判断材料を加えて編集しています。実際に訪問していない施設について宿泊体験を装う表現は使用しません。</p><a href="/editorial-policy.html">編集方針・情報源について</a></section>`;
  const topRakutenCta = a.affiliate.rakuten ? `<div class="affiliate affiliateTop"><div class="small">PR｜この記事にはアフィリエイトリンクを含みます。</div><b>最新の宿泊プラン・料金・空室を確認</b><div><a rel="sponsored noopener" target="_blank" href="${esc(a.affiliate.rakuten)}">楽天トラベルで確認する</a></div></div>` : "";
  const body = `<main class="article">
    <div class="badges"><span class="badge">${esc(area)}</span><span class="badge">${esc(cat)}</span>${tags}</div>
    <h1>${esc(a.title)}</h1>
    <p class="meta">公開 ${esc(a.date)} / 更新 ${esc(a.updatedAt || a.date)}</p>
    <div class="heroimg">${visual}</div>
    <p class="lead" style="font-size:18px">${esc(a.excerpt)}</p>
    ${topRakutenCta}
    <div class="articleBody"><p>${markdownLite(a.content)}</p></div>
    ${affiliateLinks ? `<div class="affiliate"><b>旅行予約をチェック</b><div>${affiliateLinks}</div><div class="small">PR｜リンクにはアフィリエイトを含みます。予約条件・料金はリンク先で最新情報をご確認ください。</div></div>` : ""}
    ${authorBox}
    ${relatedHtml}
  </main>`;
  const desc = a.seo.metaDescription || a.excerpt || a.title;
  const keywords = a.seo.keywords || a.tags.join(",");
  const canonical = url.origin + "/article.html?id=" + encodeURIComponent(a.id);
  const image = a.coverImage || "";
  const schema = {
    "@context":"https://schema.org",
    "@graph":[
      {
        "@type":"Article",
        "headline":a.title,
        "description":desc,
        "datePublished":a.date || undefined,
        "dateModified":a.updatedAt || a.date || undefined,
        "mainEntityOfPage":{"@type":"WebPage","@id":canonical},
        "author":{"@type":"Organization","name":"九州ファミリー旅ナビ編集部","url":url.origin+"/editorial-policy.html"},
        "publisher":{"@type":"Organization","name":"九州ファミリー旅ナビ","url":url.origin+"/"},
        "image":image ? [image] : undefined
      },
      {
        "@type":"BreadcrumbList",
        "itemListElement":[
          {"@type":"ListItem","position":1,"name":"ホーム","item":url.origin+"/"},
          {"@type":"ListItem","position":2,"name":"記事一覧","item":url.origin+"/articles.html"},
          {"@type":"ListItem","position":3,"name":a.title,"item":canonical}
        ]
      }
    ]
  };
  const head = `<meta name="description" content="${esc(desc)}"><meta name="keywords" content="${esc(keywords)}">
<link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(a.title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}">${image ? `<meta property="og:image" content="${esc(image)}">` : ""}<meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,"\\u003c")}</script>`;
  return html(layout(a.title + "｜九州ファミリー旅ナビ", body, head));
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

  const imageCandidates = [
    hotel.hotelImageUrl,
    hotel.hotelThumbnailUrl,
    hotel.roomImageUrl,
    hotel.roomThumbnailUrl,
    hotel.planImageUrl,
    hotel.planThumbnailUrl
  ].filter(Boolean);
  const uniqueImages = [...new Set(imageCandidates)].slice(0, 6);
  const articleImg = i => uniqueImages[i] || uniqueImages[0] || "";
  const hasPool = /プール|アクア|ウォーター|スライダー|水着/.test(special);
  const hasOnsen = /温泉|露天|大浴場|湯|スパ/.test(special);
  const hasKids = /キッズ|子供|子ども|ファミリー|ベビー/.test(special);

  const photoBlock = (url, alt, caption) => url
    ? `![${alt}](${url})\n\n*${caption}*\n\n`
    : "";


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
    `${name}を子連れで選ぶなら？家族旅行目線で見る料金・口コミ・アクセス`,
    `${name}は家族旅行向き？子連れで泊まる前に確認したいポイント`,
    `${name}の子連れ宿泊ガイド｜料金・口コミ・アクセスを家族目線でチェック`,
    `${pref}で${name}を選ぶ前に｜子ども連れで見るべきポイントまとめ`
  ], seed);
  const verdict = ratingNum >= 4.5 && reviewNum >= 100
    ? `数字だけを見るとかなり強い候補です。${rating}、口コミ${reviews}という組み合わせは、評価の高さと母数の両方を確認できます。`
    : ratingNum >= 4.2
      ? `評価は${rating}${reviewNum ? `、口コミ${reviews}` : ""}。候補から外す理由は少なく、次は立地とプラン条件を見る段階です。`
      : `数字だけで即決するタイプではありません。立地、客室、食事、家族全員の総額まで見て判断したいホテルです。`;

  const content = `## まず30秒でわかる結論

${opening}

${verdict}

${photoBlock(articleImg(0), `${name}の施設写真`, `${name}の施設イメージ。最新の客室・設備は予約ページで確認してください。`)}> POINT: このホテルを見るときの軸は「${localHint}」こと。料金だけではなく、移動とホテル滞在をセットで考えると選びやすくなります。

### 今わかっている基本情報

- エリア：${pref}
- 所在地：${address || "予約ページで確認"}
- 最安料金目安：${price}
- 楽天評価：${rating}
- 口コミ：${reviews}
- 情報確認日：${checked}

${special ? `楽天トラベルの施設紹介には「${special}」とあります。これは宿の個性をつかむヒントになります。` : ""}

## 客室・内装を写真でチェック

${photoBlock(articleImg(1), `${name}の客室・内装`, `客室・内装のイメージ。部屋タイプによって広さや設備は異なります。`)}
子連れでは、客室の豪華さよりも「荷物を広げても動きやすいか」「寝かしつけしやすいか」「誰がどこで寝るか」を想像して選ぶのが大切です。

> CHECK: 客室写真だけで決めず、定員・寝具・禁煙喫煙・バス・トイレ・添い寝条件まで確認してください。

## 館内施設・温泉・プール

${photoBlock(articleImg(2), `${name}の館内施設`, `館内施設のイメージ。営業日や利用条件は予約前に確認してください。`)}
${hasPool ? `施設紹介からプール・水遊び系の設備が確認できるホテルです。子どもが楽しみにしやすいポイントなので、営業期間・対象年齢・水遊び用パンツ・浮き輪などの条件を予約前に確認しておくと安心です。` : ""}
${hasOnsen ? `温泉・大浴場系の設備があるホテルなら、観光を詰め込みすぎず「ホテルでゆっくりする時間」を旅程に入れると満足度が上がりやすいです。` : ""}
${hasKids ? `キッズ・ファミリー向け設備が案内されている場合は、対象年齢と利用時間を確認しておくと、子どもの昼寝や夕食時間と合わせやすくなります。` : ""}

${photoBlock(articleImg(3), `${name}での滞在イメージ`, `ホテルで過ごす時間をイメージしやすい写真です。`)}

## 編集部ならここから見る

ホテル選びで大事なのは、情報の多さではなく“何を優先するか”です。

${name}なら、①到着までの移動、②子どもの年齢に合う客室・食事、③家族全員の総額、④口コミの偏り、⑤キャンセル条件、の順に見ます。

## ${pref}旅行の中でどう使うホテルか

${localHint}という点を意識すると、ホテル単体ではなく旅行全体の組み方が見えます。

${access ? `アクセス案内は「${access}」。観光を何時に切り上げるかまで考える材料になります。` : "アクセスは予約ページで最新情報を確認したいところです。"}

> MEMO: 子ども連れでは「移動時間」より「移動の回数」が疲れにつながることがあります。乗り換えや駐車場からの移動も含めて考えると現実的です。

## 料金を見るときに一番気をつけたいこと

最安料金の目安は${price}です。ただし、大人2名表示と家族全員の総額は違うことがあります。

予約時は、大人・小学生・幼児を正しく入力し、食事、寝具、添い寝条件までそろえて比較します。

${pricePerspective(priceNum)}という価格感なので、条件が合えば候補になります。

> CHECK: 「最安プラン」と「家族に必要な条件が入ったプラン」は別物。最後は総額で比較してください。

## 口コミは“点数”より“似た家族”を見る

楽天評価は${rating}、口コミは${reviews}です。

0〜2歳ならベビーカーや添い寝、3〜6歳なら夕食時間や館内移動、小学生なら朝食や周辺観光への動きやすさを見ると参考になります。

## 年齢別に見る確認ポイント

### 0〜2歳

ベビーベッド、ベッドガード、離乳食、電子レンジ、添い寝条件など、必須設備から逆算します。未確認の設備は「ある」と断定しません。

### 3〜6歳

夕方に疲れが出やすいので、チェックインと夕食の間に30分でも休憩時間が取れるかを考えます。

### 小学生

本人にもホテル写真を見せて、客室・食事・周辺観光のどれを楽しみにしているか聞いてみると、家族の優先順位が見えます。

## 食事付きか素泊まりか

小さな子どもがいるなら、ホテル内で夕食まで完結するプランはかなり楽です。一方、周辺グルメを楽しみたい家庭なら朝食のみや素泊まりが合うこともあります。

## 客室は“広さ”より“寝かせ方”

赤ちゃんや幼児ならベッドの高さや配置、小学生を含む家族ならベッド数や布団条件まで確認します。

## 1泊2日ならこのくらいが現実的

### 1日目
昼すぎまで観光し、チェックインの1時間前にはホテル方向へ。到着後はすぐ次の予定へ行かず30分休憩。

### 2日目
朝食後に荷物をまとめてチェックアウト。午前中に観光を一つ入れ、昼食後は帰宅方向へ。

“最後まで遊び切る”より“帰宅まで機嫌よく”を目標にすると、家族旅行はかなり楽になります。

## こんな家族には候補にしやすい

- ${pref}で家族旅行の宿を探している
- 口コミと料金を両方見て決めたい
- 子どもの年齢に合わせて旅程を組みたい
- 宿泊前に条件をきちんと確認したい

## 逆に、ここは予約前に再確認

- 必須のベビー用品がある
- 送迎や駐車場が必須
- アレルギー対応が必要
- ベッド構成にこだわりがある
- キャンセル条件を柔軟にしたい

## 最後に｜「泊まりたい」より「泊まりやすい」で決める

${name}は、${pref}の家族旅行で比較候補に入れやすいホテルです。

最終判断は評価点ではなく、自分たちの移動、子どもの年齢、食事、予算に合うかどうか。

記事内の楽天トラベルリンクから、最新料金・空室・プラン条件を確認できます。

---

**編集方針と情報源**  
この記事は${checked}時点で楽天トラベルAPIから取得した施設情報を基礎資料とし、九州ファミリー旅ナビ編集部が家族旅行の判断材料を加えて編集しています。実際に宿泊したと誤認させる体験談は掲載していません。

**広告について**  
この記事にはアフィリエイトリンクを含みます。リンク経由の予約で当サイトに報酬が発生する場合がありますが、読者の予約料金が上乗せされるものではありません。`;

  return {
    id: "hotel-" + String(hotel.hotelNo || Date.now()),
    title,
    area: /大分/.test(address) ? "oita" : /福岡/.test(address) ? "fukuoka" : /熊本/.test(address) ? "kumamoto" : /佐賀/.test(address) ? "saga" : /長崎/.test(address) ? "nagasaki" : /宮崎/.test(address) ? "miyazaki" : /鹿児島/.test(address) ? "kagoshima" : "kyushu",
    category: "hotel",
    icon: "🏨",
    excerpt: `${name}を子連れで選ぶときに見るべきポイントを、料金・口コミ・アクセス・年齢別の旅程まで家族旅行目線で整理しました。`,
    content,
    tags: [name, pref, "子連れホテル", "家族旅行", "九州旅行"],
    ageGroups: ["0-2歳","3-6歳","7歳以上"],
    practical: ["家族全員の総額を確認","最近の口コミを確認","必須設備を事前確認","移動とホテル時間をセットで考える"],
    seoMetaDescription: `${name}は子連れにおすすめ？${pref}の家族旅行で気になる料金・口コミ・アクセス・年齢別の確認ポイントを詳しく解説。`,
    seoKeywords: `${name} 子連れ,${name} 家族旅行,${name} 口コミ,${name} 料金,${pref} 子連れ ホテル`
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

  // 4) 詳細情報を追加取得。
  await sleepMs(1400);
  const detailParams = new URLSearchParams({
    applicationId: env.RAKUTEN_APPLICATION_ID,
    accessKey: env.RAKUTEN_ACCESS_KEY,
    format: "json",
    formatVersion: "2",
    hotelNo: String(selected.hotelNo),
    responseType: "large",
    hotelThumbnailSize: "3"
  });
  if (env.RAKUTEN_AFFILIATE_ID) detailParams.set("affiliateId", env.RAKUTEN_AFFILIATE_ID);

  const detailRes = await rakutenServerFetch(
    "https://openapi.rakuten.co.jp/engine/api/Travel/HotelDetailSearch/20260731?" + detailParams.toString(),
    env
  );

  if (detailRes.ok) {
    const detailed = normalizeHotelCandidates(detailRes.data)[0];
    if (detailed) selected = { ...selected, ...detailed };
  }

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
  const hotel = input.hotel || {};
  const rakutenUrl = String(input.rakutenUrl || hotel.hotelInformationUrl || hotel.planListUrl || "").trim();

  if (!hotel.hotelName || !rakutenUrl) {
    return json({ error: "ホテル情報または楽天URLが不足しています。" }, { status: 400 });
  }

  const a = buildFamilyHotelArticle(hotel);
  const coverImage = String(hotel.hotelImageUrl || hotel.hotelThumbnailUrl || "").trim();

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

function normalizeRakutenHotels(data) {
  const source = Array.isArray(data?.hotels) ? data.hotels : (Array.isArray(data?.items) ? data.items : []);
  const hotels = [];
  for (const item of source) {
    const basic = pickHotelBasicInfo(item) || item?.hotelBasicInfo || item;
    if (!basic || !basic.hotelName) continue;
    hotels.push({
      hotelNo: basic.hotelNo || "",
      hotelName: basic.hotelName || "",
      hotelKanaName: basic.hotelKanaName || "",
      hotelInformationUrl: basic.hotelInformationUrl || "",
      planListUrl: basic.planListUrl || "",
      hotelSpecial: basic.hotelSpecial || "",
      hotelMinCharge: basic.hotelMinCharge ?? null,
      address: [basic.address1, basic.address2].filter(Boolean).join(""),
      access: basic.access || "",
      parkingInformation: basic.parkingInformation || "",
      hotelImageUrl: basic.hotelImageUrl || "",
      hotelThumbnailUrl: basic.hotelThumbnailUrl || "",
      reviewAverage: basic.reviewAverage ?? null,
      reviewCount: basic.reviewCount ?? null
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

function adminPage() {
  const body = `<div id="loginBox" class="login">
    <h2>管理画面ログイン</h2>
    <p>Cloudflare Workers の ADMIN_PASSWORD を入力してください。</p>
    <div class="field"><input id="pw" class="input" type="password" placeholder="管理パスワード"></div>
    <button id="loginBtn" class="btn" type="button" onclick="adminLoginDirect()">ログイン</button>
    <div id="loginStatus" class="small"></div>
    <div class="small" style="margin-top:10px;opacity:.65">admin v7.2.2</div>
  </div>
  <main id="adminApp" class="admin" style="display:none">
    <section class="adminHero">
      <div>
        <div class="eyebrow">KYUSHU FAMILY TRIP NAVI</div>
        <h1>🤖 自動運用ダッシュボード</h1>
        <p>毎朝6:10の自動作成を中心に、記事・楽天API・実行履歴をひとつの画面で確認できます。</p><div class="small" style="margin-top:8px;color:rgba(255,255,255,.65)">dashboard v7.4.1 / <span id="directDashVersion">direct loader</span></div>
      </div>
      <div class="heroActions">
        <button id="dashAutoRunBtn" class="btn" type="button">今すぐ1記事作成</button>
        <button id="dashRefreshBtn" class="btn sub" type="button" onclick="dashboardLoadDirect();articleListLoadDirect()">↻ 更新</button>
        <button id="logoutBtn" class="btn sub" type="button">ログアウト</button>
      </div>
    </section>

    <section class="statGrid">
      <div class="statCard"><span>公開記事</span><strong id="statArticles">--</strong><small>件</small></div>
      <div class="statCard"><span>楽天リンク付き</span><strong id="statAffiliate">--</strong><small>件</small></div>
      <div class="statCard"><span>自動作成成功</span><strong id="statAutoSuccess">--</strong><small>件</small></div>
      <div class="statCard"><span>次回自動実行</span><strong style="font-size:22px">6:10</strong><small>毎朝 JST</small></div>
    </section>

    <section class="adminGrid2">
      <div class="smartCard">
        <div class="smartCardHead">
          <div><div class="eyebrow">AUTOMATION</div><h2>自動作成ステータス</h2></div>
          <span id="autoStatusBadge" class="statusBadge">確認中</span>
        </div>
        <div id="dashAutoStatus" class="timelineBox">状態を取得しています...</div>
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
        <div class="small" style="margin-top:8px;opacity:.65">GitHub panel v7.4.1</div>
      </form>
    </section>

    <section class="smartCard">
      <div class="smartCardHead">
        <div><div class="eyebrow">RECENT ACTIVITY</div><h2>最近の自動作成</h2></div>
        <span class="sectionHint">直近8件</span>
      </div>
      <div id="recentAutoRuns" class="activityList">読み込み中...</div>
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
        <button id="autoHotelRunBtn" class="btn" type="button">今すぐ1記事を自動作成</button>
        <div id="autoHotelStatus" class="small" style="margin-top:10px">状態を確認中...</div>
      </div>
      <div class="panel" style="margin:12px 0;background:#fbfffd">
        <h3 style="margin-top:0">🟥 楽天ホテル検索</h3>
        <p class="small">ホテル名を入力 → 楽天トラベルAPIで検索 → 候補を選ぶとアフィリエイトURLを自動入力します。さらに、そのホテルの記事を自動作成できます。</p>
        <div class="row">
          <div class="field"><input id="rakutenKeyword" class="input" placeholder="例：杉乃井ホテル"></div>
          <div class="field"><button id="rakutenSearchBtn" class="btn" type="button">楽天で検索</button></div>
        </div>
        <div id="rakutenSearchStatus" class="small"></div>
        <div id="rakutenResults"></div>
        <div id="hotelArticleAutoBox" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid #d8e6df">
          <button id="hotelArticleBtn" class="btn" type="button">このホテルの記事を自動作成</button>
          <div id="hotelArticleStatus" class="small" style="margin-top:8px"></div>
        </div>
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
      <div class="btns"><button id="saveBtn" class="btn">保存</button><button id="newBtn" class="btn sub">新規入力</button></div>
      <div id="saveStatus" class="status">準備完了</div>
    </div>
      </div>
    </details>

    <section id="articleListSection" class="smartCard adminSection">
      <div class="smartCardHead">
        <div><div class="eyebrow">CONTENT</div><h2>記事一覧</h2><div class="sectionHint">article list v7.4.1</div></div>
        <div class="miniActions" style="margin-top:0"><button class="btn sub" type="button" onclick="articleListLoadDirect()">↻ 再読み込み</button><button id="newArticleTopBtn" class="btn sub" type="button">＋ 新規記事</button></div>
      </div>
      <div id="articleList">読み込み中...</div>
    </section>
  </main>
<script>

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
  setTimeout(function(){
    if(sessionStorage.getItem("adminPassword") && document.getElementById("adminApp") && document.getElementById("adminApp").style.display!=="none"){
      dashboardLoadDirect();
      articleListLoadDirect();
    }
  },800);
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

  $("dashAutoRunBtn").onclick=runAutoFromDashboard;
  $("dashRefreshBtn").onclick=function(){ loadDashboard(); loadArticles(); };
  $("jumpHotelSearch").onclick=function(){
    $("articleEditorSection").open=true;
    setTimeout(function(){ $("hotelSearchSection").scrollIntoView({behavior:"smooth",block:"start"}); },50);
  };
  $("jumpArticleEditor").onclick=function(){
    $("articleEditorSection").open=true;
    setTimeout(function(){ $("articleEditorSection").scrollIntoView({behavior:"smooth",block:"start"}); },50);
  };
  $("jumpArticleList").onclick=function(){ $("articleListSection").scrollIntoView({behavior:"smooth",block:"start"}); };
  $("jumpGithubZip").onclick=function(){ $("githubZipSection").scrollIntoView({behavior:"smooth",block:"start"}); };
  $("newArticleTopBtn").onclick=function(){
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
  $("saveBtn").onclick=async function(){
    var p=payload(); var method=p.id?"PUT":"POST"; $("saveStatus").textContent="保存中...";
    var r=await fetch("/api/articles",{method:method,headers:headers(),body:JSON.stringify(p)});
    var d=await r.json().catch(function(){return {};});
    if(!r.ok){$("saveStatus").textContent="保存失敗: HTTP "+r.status+" "+(d.error||"");return;}
    $("saveStatus").textContent="保存しました。公開サイトへ即時反映されます。"; clearForm(); loadArticles();
  };
  $("newBtn").onclick=clearForm;
  function clearForm(){ ["id","title","coverImage","coverAlt","excerpt","content","tags","ageGroups","practical","rakuten","jalan","yahoo","metaDescription","keywords"].forEach(function(x){$(x).value="";}); $("date").value=new Date().toISOString().slice(0,10); $("icon").value="🧳"; $("published").checked=true; $("featured").checked=false; updatePreview(); }
  function updatePreview(){var u=$("coverImage").value.trim();$("imagePreview").innerHTML=u?'<img src="'+u.replace(/"/g,"&quot;")+'" alt="プレビュー">':'画像URLを入れるとプレビューします';}
  $("coverImage").addEventListener("input",updatePreview);
  async function deleteArticle(id){
    if(!confirm("この記事を削除しますか？")) return;
    var r=await fetch("/api/articles",{method:"DELETE",headers:headers(),body:JSON.stringify({id:id})});
    if(r.ok) loadArticles(); else alert("削除に失敗しました");
  }
  $("premiumBtn").onclick=async function(){
    if(!confirm("既存7記事の本文・タイトル・SEO等を高品質版へ更新します。実行しますか？")) return;
    $("premiumStatus").textContent="更新中...";
    var r=await fetch("/api/premium-articles",{method:"POST",headers:headers()});
    var d=await r.json().catch(function(){return {};});
    if(!r.ok){$("premiumStatus").textContent="更新失敗: HTTP "+r.status+" "+(d.error||"");return;}
    $("premiumStatus").textContent="更新完了: "+d.updated+"/"+d.total+"件"+(d.missing&&d.missing.length?" / 見つからないID: "+d.missing.join(", "):"");
    loadArticles();
  };

  $("rakutenSearchBtn").onclick=async function(){
    var kw=$("rakutenKeyword").value.trim();
    if(kw.length<2){$("rakutenSearchStatus").textContent="ホテル名を2文字以上入力してください。";return;}
    $("rakutenSearchStatus").textContent="楽天トラベルを検索中...";
    $("rakutenResults").innerHTML="";
    var r=await fetch("/api/rakuten-hotels?keyword="+encodeURIComponent(kw),{headers:headers()});
    var d=await r.json().catch(function(){return {};});
    if(!r.ok){
      var upstream=d.rakutenStatus?(" / 楽天HTTP "+d.rakutenStatus):"";
      var detail=(d.rakutenError||d.rakutenMessage)?(" / "+(d.rakutenError||"")+(d.rakutenMessage?": "+d.rakutenMessage:"")):"";
      $("rakutenSearchStatus").textContent="検索失敗: HTTP "+r.status+" "+(d.error||"")+upstream+detail;
      return;
    }
    $("rakutenSearchStatus").textContent=d.count+"件見つかりました。"+(d.affiliateEnabled?" アフィリエイトURL対応済み。":" ※Affiliate ID未設定のため通常URLです。");
    var rows=d.hotels||[];
    $("rakutenResults").innerHTML=rows.map(function(h,i){
      var price=h.hotelMinCharge?(" / 最安目安 "+Number(h.hotelMinCharge).toLocaleString()+"円〜"):"";
      var rating=h.reviewAverage?(" / ★"+h.reviewAverage):"";
      var img=h.hotelThumbnailUrl?('<img class="rakutenResultImg" src="'+h.hotelThumbnailUrl.replace(/"/g,"&quot;")+'" alt="">'):"";
      return '<div class="rakutenResultCard">'+img+
        '<div class="rakutenResultInfo"><b class="rakutenHotelName">'+escapeHtmlClient(h.hotelName)+'</b><div class="small">'+escapeHtmlClient(h.address||"")+price+rating+'</div></div>'+
        '<button type="button" class="btn sub rakutenUseBtn" data-i="'+i+'">このホテルを使う</button></div>';
    }).join("") || "<p>候補がありません。</p>";
    Array.from(document.querySelectorAll(".rakutenUseBtn")).forEach(function(b){
      b.onclick=function(){
        var h=rows[Number(b.dataset.i)];
        $("rakuten").value=h.hotelInformationUrl||h.planListUrl||"";
        if(!$("coverImage").value && (h.hotelImageUrl||h.hotelThumbnailUrl)){
          $("coverImage").value=h.hotelImageUrl||h.hotelThumbnailUrl;
          if(typeof updatePreview==="function") updatePreview();
        }
        if(!$("coverAlt").value) $("coverAlt").value=h.hotelName||"";
        window.__selectedRakutenHotel=h;
        $("hotelArticleAutoBox").style.display="block";
        $("hotelArticleStatus").textContent="";
        $("rakutenSearchStatus").textContent="選択しました："+h.hotelName+"。このまま記事を自動作成できます。";
      };
    });
  };


  async function refreshAutoHotelStatus(){
    try{
      var r=await fetch("/api/auto-hotel",{headers:headers()});
      var d=await r.json();
      if(!r.ok){$("autoHotelStatus").textContent="状態取得失敗";return;}
      if(!d.last){
        $("autoHotelStatus").textContent="まだ自動実行履歴はありません。";
        return;
      }
      var x=d.last;
      $("autoHotelStatus").textContent=
        "最終実行: "+(x.runAt||"")+" / "+(x.status||"")+
        (x.prefecture?(" / "+x.prefecture):"")+
        (x.hotelName?(" / "+x.hotelName):"")+
        (x.message?(" / "+x.message):"");
    }catch(e){
      $("autoHotelStatus").textContent="状態取得に失敗しました。";
    }
  }

  $("autoHotelRunBtn").onclick=async function(){
    $("autoHotelRunBtn").disabled=true;
    $("autoHotelStatus").textContent="九州のおすすめホテルを検索して記事を作成中...";
    try{
      var r=await fetch("/api/auto-hotel",{method:"POST",headers:headers()});
      var d=await r.json().catch(function(){return {};});
      if(!r.ok){
        $("autoHotelStatus").textContent="自動作成失敗: "+(d.error||("HTTP "+r.status));
      }else if(d.skipped){
        $("autoHotelStatus").textContent="今回はスキップ: "+(d.reason||"候補なし");
      }else{
        $("autoHotelStatus").innerHTML=
          "自動作成完了 ✅ "+escapeHtmlClient(d.hotelName||"")+
          ' <a href="'+d.url+'" target="_blank">記事を見る</a>';
        loadArticles();
      }
    }catch(e){
      $("autoHotelStatus").textContent="自動作成に失敗しました。";
    }
    $("autoHotelRunBtn").disabled=false;
    loadDashboard();
  };

  // refreshAutoHotelStatus is called after login through the dashboard flow.

  $("hotelArticleBtn").onclick=async function(){
    var h=window.__selectedRakutenHotel||{};
    var rakutenUrl=$("rakuten").value.trim();
    if(!h.hotelName||!rakutenUrl){
      $("hotelArticleStatus").textContent="先にホテル候補の「このホテルを使う」を押してください。";
      return;
    }

    $("hotelArticleBtn").disabled=true;
    $("hotelArticleStatus").textContent=h.hotelName+"の記事を自動作成中...";

    var r=await fetch("/api/hotel-article",{
      method:"POST",
      headers:headers(),
      body:JSON.stringify({hotel:h,rakutenUrl:rakutenUrl})
    });
    var d=await r.json().catch(function(){return {};});
    $("hotelArticleBtn").disabled=false;

    if(!r.ok){
      $("hotelArticleStatus").textContent="作成失敗: HTTP "+r.status+" "+(d.error||"");
      return;
    }

    $("hotelArticleStatus").innerHTML=
      '作成完了 ✅ 約'+Number(d.charCount||0).toLocaleString()+
      '文字 <a href="'+d.url+'" target="_blank">公開記事を確認する</a>';
    loadArticles();
  };

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
    `<url><loc>${esc(url.origin + "/")}</loc></url>`,
    `<url><loc>${esc(url.origin + "/articles.html")}</loc></url>`,
    ...rows.map(a => `<url><loc>${esc(url.origin + "/article.html?id=" + encodeURIComponent(a.id))}</loc><lastmod>${esc(a.updatedAt || a.date || todayJst())}</lastmod></url>`)
  ];
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
      if (url.pathname === "/articles.html") return await articlesPage(env, url);
      if (url.pathname === "/sitemap.xml") return await sitemapPage(env, url);
      if (url.pathname === "/robots.txt") return robotsPage(url);
      if (url.pathname === "/article.html") return await articlePage(env, url);
      if (url.pathname === "/editorial-policy.html") return editorialPolicyPage(url);
      if (url.pathname === "/admin.html") return adminPage();
      return html(layout("ページが見つかりません", '<main class="article"><h1>404</h1><p>ページが見つかりません。</p></main>'), { status:404 });
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, { status:500 });
    }
  }
};
