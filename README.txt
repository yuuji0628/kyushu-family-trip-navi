v8.2.3｜既存記事の壊れた画像を楽天APIから再取得して復旧

今回の修正:
1. まず記事に保存されている元画像URLを直接表示
2. その画像が失敗した場合だけ /media/article-image へ切替
3. WorkerがD1の記事IDからホテル名を取得
4. 楽天トラベルAPIでホテルをもう一度検索
5. 最新の施設詳細を取得
6. 客室 / 食事 / プール / 温泉 / 施設など、元の項目に近い写真を選択
7. 画像をサーバー側で取得して表示
8. それでも写真が存在しない場合は、巨大な「読み込めませんでした」枠を表示せず、その写真枠自体を非表示

また、
- 既存記事に残っていた「*ホテルの外観・施設写真です*」など重複説明を表示時に整理
- 新規記事では写真の下に同じ説明文を二重表示しない

API負荷対策:
- 記事ごとの最新写真一覧をCloudflare Cacheに6時間キャッシュ
- 壊れた写真ごとに毎回楽天検索を繰り返さない構成

維持:
SEO MAX / PHOTO-DRIVEN FAMILY / Family Magazine /
写真分類 / Nativeホテル検索 / Native Login / Native記事作成 /
Native削除 / GitHub ZIP / D1 / Cron

GitHubでは worker.js を置き換えてください。
反映後:
dashboard v8.2.3 / FRESH IMAGE REPAIR
