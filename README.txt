v7.6.4｜削除ボタンをJavaScript非依存に変更

原因:
Native Login後は認証がHttpOnly Cookie中心になっていますが、
削除ボタンはまだJavaScriptの articleDeleteDirect() に依存していました。
そのためiPhoneでボタン操作が安定しない/認証情報を取得できないケースが残っていました。

修正:
- 削除ボタンを通常のHTMLフォームに変更
- POST /admin-delete-article をWorker側で直接処理
- Cookie認証でD1から記事を削除
- 削除後は管理画面へ戻り、削除結果を表示
- 削除ボタン自体はonclickを使用しない

維持:
Native Login / Native記事作成 / Server Render / 写真品質改善 /
GitHub ZIP / 楽天API / D1 / Cron

反映後:
dashboard v7.6.4 / NATIVE DELETE
article list v7.6.4 / NATIVE DELETE
と表示されます。
