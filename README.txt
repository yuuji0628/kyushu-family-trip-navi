v7.5.0｜管理画面 全機能再チェック版

根本原因:
「既存記事の品質アップデート」を画面から削除した後も、
premiumBtn / premiumStatus の古いJavaScriptだけが残っていました。
存在しないpremiumBtnに .onclick を設定したところでJavaScriptが停止し、
その後に設定される楽天ホテル検索・下側の記事自動作成などが反応しなくなっていました。

修正:
- premiumBtn / premiumStatus の旧JavaScriptを完全削除
- 上部と下部の記事自動作成ボタンを独立処理化
- 45秒タイムアウトと具体的エラー表示
- optionalなボタンのイベント登録は、要素が存在するときだけ行う
- 編集 / 削除 / 保存 / 新規 / 楽天ホテル検索 / GitHub ZIPを維持
- 写真付き自動記事、D1、楽天API、GitHub Secret、Cronを維持

再チェック:
- worker.js構文チェック
- 管理画面内inline JavaScriptを個別構文チェック
- 存在しないDOM参照 0件
- 固定ID付きボタンの未接続 0件
- 主要ボタン11個の存在確認
- 主要API / D1 / Secret / Cron / 写真記事機能の保持確認

反映後:
dashboard v7.5.0 / UI AUDIT OK
article list v7.5.0
と表示されます。
