v7.9.1｜客室写真の誤分類をさらに厳格化

スクリーンショットで確認できた問題:
食事写真が「客室・内装」として表示されていました。

原因:
楽天APIの roomImageUrl というフィールド名だけを信用すると、
実際には食事・施設系の写真が入っているケースがあります。

修正:
- roomImageUrl だからといって無条件に客室扱いしない
- URL/パスに room / guestroom / bedroom / bed 等の客室根拠がある場合のみ客室へ
- food / breakfast / dinner / buffet / restaurant 等は食事を最優先
- pool / aqua はプールを優先
- bath / onsen / spa は温泉を優先
- 判別できない写真は「楽天掲載写真」として掲載
- 取得できる写真自体は捨てず、重複なく記事内に残す
- 客室には「客室と確認できた画像」だけを掲載

既存機能:
全写真ギャラリー / 食事写真 / 温泉 / プール / ファミリー向けデザイン /
記事バリエーション / Nativeホテル検索 / Native Login / Native記事作成 /
Native削除 / GitHub ZIP / D1 / Cron

GitHubでは worker.js を置き換えてください。
反映後:
dashboard v7.9.1 / PHOTO CLASSIFY FIX
