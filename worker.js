
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
.login{max-width:520px;margin:70px auto;padding:28px;border:1px solid var(--line);border-radius:22px}.input,textarea,select{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font:inherit;background:#fff}.field{margin:14px 0}.admin{max-width:1000px;margin:40px auto;padding:0 20px}.panel{border:1px solid var(--line);border-radius:20px;padding:24px;margin:20px 0}.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.small{font-size:13px;color:var(--muted)}.status{padding:10px 14px;border-radius:10px;background:var(--soft);margin:12px 0}.preview{margin-top:10px;border:1px dashed var(--line);border-radius:14px;min-height:90px;display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--muted)}.preview img{width:100%;max-height:260px;object-fit:cover}
.notice{padding:14px 16px;border-radius:12px;background:#fff8d8;border:1px solid #f2e29d}
@media(max-width:800px){.nav{display:none}.menuBtn{display:block}.grid{grid-template-columns:1fr}.areaGrid{grid-template-columns:repeat(2,1fr)}.hero{padding:48px 0}.heroGrid{grid-template-columns:1fr}.heroPanel{display:none}.section{padding:46px 0}.row{grid-template-columns:1fr}.sectionHead{align-items:start}.brand{font-size:20px}.searchbar{display:grid;grid-template-columns:1fr auto}}
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
  const canonical = url.origin + "/article.html?id=" + encodeURIComponent(a.id);
  const image = a.coverImage || "";
  const schema = {
    "@context":"https://schema.org","@type":"Article","headline":a.title,"description":desc,
    "datePublished":a.date || undefined,"dateModified":a.updatedAt || a.date || undefined,
    "mainEntityOfPage":canonical,"publisher":{"@type":"Organization","name":"九州ファミリー旅ナビ"}
  };
  if (image) schema.image = [image];
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
      <h2>✍️ 記事品質アップデート</h2>
      <p>既存7記事を、読み物として楽しめる長文版へ一括更新します。タイトル・要約・本文・SEO・タグを更新し、D1へ直接反映します。</p>
      <div class="notice">体験描写は、実際の訪問を偽らず「子連れで訪れる場面を想定した編集部目線」で書いています。施設情報は変更されるため、記事内でも公式情報の再確認を案内しています。</div>
      <div class="btns"><button id="premiumBtn" class="btn">7記事を高品質版へ更新</button></div>
      <div id="premiumStatus" class="status">未実行</div>
    </div>
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
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/articles") return await handleApi(request, env);
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
      if (url.pathname === "/admin.html") return adminPage();
      return html(layout("ページが見つかりません", '<main class="article"><h1>404</h1><p>ページが見つかりません。</p></main>'), { status:404 });
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, { status:500 });
    }
  }
};
