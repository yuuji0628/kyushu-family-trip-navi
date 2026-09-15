楽天ホテル検索 自動化 v6.4

今回の修正:
- 管理画面→Workerに届いた「実際のReferer」を楽天APIへ引き継ぐ方式に変更
- Safari等でRefererが無い場合は登録済み管理画面URLを補完
- 管理者パスワード、Cookie、Authorization等は楽天へ転送しない
- v6.2以降のレート制限自動リトライを維持
- Cloudflareの既存シークレット / 変数 / D1バインディングは変更しません

GitHubルート直下の worker.js だけ置き換えてください。
Cloudflare側の変数・シークレットは触らなくてOKです。
