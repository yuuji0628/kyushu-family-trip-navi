楽天ホテル検索 自動化 v6.3

今回の修正:
- 楽天APIが要求する HTTP Referer を追加
- Referer は楽天Web Serviceに登録した公開サイトURL:
  https://kyushu-family-trip-navi-worker.rrwpvwmz8p.workers.dev/
- v6.2 のレート制限自動リトライも維持
- Cloudflareの既存シークレット / 変数 / D1バインディングは変更しません

GitHubルート直下の worker.js だけ置き換えてください。
Cloudflare側の変数・シークレットは触らなくてOKです。
