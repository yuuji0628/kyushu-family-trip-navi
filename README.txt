v8.2.1｜画像が「？」になる問題を修正

原因:
v8.1.0以降で画像取得対象を広げた結果、
楽天側の画像URLをブラウザから直接表示した際に
ホットリンク制限・Referer制限・リダイレクト等で表示できないケースがありました。

修正:
- 記事内の楽天画像を /media/image 経由でWorkerが取得
- 楽天トラベルのRefererを付けてサーバー側から画像取得
- 失敗時はRefererなしで1回再試行
- Content-Typeがimage/*か確認
- 楽天/R10系ドメインのみ許可し、SSRFを防止
- 既にD1へ保存済みの記事も表示時に自動的に画像プロキシを利用
- 新規記事の画像URL収集も許可ドメインに限定
- それでも取得できない画像は壊れた「？」アイコンではなく、
  「写真を読み込めませんでした」のプレースホルダーを表示

既存機能:
SEO MAX / PHOTO-DRIVEN FAMILY / Family Magazine / Reader Clean /
写真分類 / Nativeホテル検索 / Native Login / Native記事作成 /
Native削除 / GitHub ZIP / D1 / Cron

GitHubでは worker.js を置き換えてください。
反映後:
dashboard v8.2.1 / IMAGE PROXY FIX
