v7.6.1｜記事作成ボタンをJavaScript非依存に変更

- 上部「今すぐ1記事作成」を通常フォーム送信へ変更
- 下部「今すぐ1記事を自動作成」も通常フォーム送信へ変更
- POST /admin-auto-create をWorker側で処理
- Workerが autoCreateKyushuHotelArticle(env) を直接実行
- 成功 / スキップ / エラーをサーバー描画で表示
- 旧JavaScriptのボタンIDとは別IDにして干渉を防止

維持:
Native Login / Server Render / 記事編集・削除 / 楽天ホテル検索 /
GitHub ZIP / 写真付き記事 / D1 / 楽天API / GitHub / Cron

反映後:
dashboard v7.6.1 / NATIVE CREATE
と表示されます。
