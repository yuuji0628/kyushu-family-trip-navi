# 九州ファミリー旅ナビ

Cloudflare Pages で公開できる、スマホ対応の静的サイトです。

## 含まれるページ
- `index.html` トップページ
- `articles.html` 記事一覧・検索・絞り込み
- `article.html?id=...` 記事詳細
- `admin.html` 管理画面

## 管理画面について
初期版はサーバー不要で動かせるよう、記事の追加・編集データをブラウザの LocalStorage に保存します。
そのため、別端末や別ブラウザとは共有されません。
本番運用で複数端末から管理したい場合は、Cloudflare D1 + Pages Functions に拡張してください。

## Cloudflare Pages 公開手順
1. このフォルダを GitHub リポジトリへアップロード
2. Cloudflare Dashboard > Workers & Pages > Create > Pages > Connect to Git
3. 対象リポジトリを選択
4. Framework preset: None
5. Build command: 空欄
6. Build output directory: `/`
7. Deploy

GitHub を使わず、Cloudflare Pages の Direct Upload でも公開できます。
