# 九州ファミリー旅ナビ Workers版

Cloudflare Workers + Static Assets + D1 用の構成です。

## Cloudflare Workers Builds 設定
- Build command: 空欄
- Deploy command: `npx wrangler deploy`
- Production branch: `main`

## Workers作成後に追加するRuntime設定
- D1 Binding name: `DB`
- D1 Database: 既存の `kyushu-family-trip-navi-db`
- Secret: `ADMIN_PASSWORD`

設定後にGitHubへコミットするとWorkers Buildsが自動デプロイします。

## D1
既存D1で `schema.sql` を実行済みなら再実行不要です。

## 確認URL
`https://<worker-name>.<subdomain>.workers.dev/api/articles?health=1`

正常時:
`{"ok":true,"storage":"d1"}`
