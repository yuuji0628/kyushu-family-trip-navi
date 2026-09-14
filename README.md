# 九州ファミリー旅ナビ（全部入り改良版）

Cloudflare Pages で公開できる、子連れ旅行サイトの完成版です。

## 今回入れた改善

1. **写真表示対応**
   - 記事カード・記事詳細でカバー画像を表示
   - 管理画面から画像URLを登録可能

2. **記事カードの情報量アップ**
   - タグ
   - 対象年齢
   - 実用情報（駐車場・授乳室・ベビーカー・キッズメニュー・屋内）

3. **Cloudflare D1 + Pages Functions 対応**
   - `functions/api/articles.js`
   - `schema.sql`
   - 管理画面でD1へ保存可能
   - D1未設定時はローカルモードで動作

4. **アフィリエイト導線**
   - 記事詳細に楽天トラベル / じゃらん / Yahoo!トラベル導線を設置
   - 管理画面からURL登録可能

5. **SEO強化**
   - エリア別ページ（7県分）
   - `robots.txt`
   - `sitemap.xml`
   - 各ページのメタ情報強化

---

## ファイル構成

```text
kyushu-family-trip-navi-complete/
├─ index.html
├─ articles.html
├─ article.html
├─ admin.html
├─ fukuoka.html
├─ saga.html
├─ nagasaki.html
├─ kumamoto.html
├─ oita.html
├─ miyazaki.html
├─ kagoshima.html
├─ styles.css
├─ app.js
├─ articles.json
├─ robots.txt
├─ sitemap.xml
├─ _headers
├─ schema.sql
├─ README.md
└─ functions/
   └─ api/
      └─ articles.js
```

---

## Cloudflare Pages 公開方法

### 1. GitHubにアップロード
このフォルダの中身を、GitHub リポジトリ直下へ入れてください。

### 2. Pagesの設定
- Framework preset: **なし**
- Build command: **空欄**
- Build output directory: **空欄**
- Production branch: **main**

### 3. D1データベース作成
Cloudflare ダッシュボードで D1 を新規作成し、名前は任意でOKです。

### 4. `schema.sql` を実行
D1のコンソールで `schema.sql` の中身を実行してください。

### 5. Pages に D1 バインディングを追加
Pages プロジェクト → Settings → Functions → D1 bindings
- Variable name: `DB`
- Database: 作成したD1

### 6. 環境変数を追加
Pages プロジェクト → Settings → Environment variables
- `ADMIN_PASSWORD` = 任意の管理パスワード

### 7. 再デプロイ
保存後に再デプロイしてください。

### 8. 初期記事をD1に投入
`/admin.html` にアクセスして、
- 管理パスワードでログイン
- 「初期記事をD1へ取り込む」
を押すと `articles.json` の初期記事がD1に登録されます。

---

## 管理画面の動き

### D1モード
- 複数端末で共通管理
- Cloudflare上のデータベースに保存

### ローカルモード
- D1未設定でも試せる
- ただし保存先はその端末のブラウザ内のみ

---

## 注意点

- サンプル画像は外部URLを使っています。必要なら自分の画像URLへ差し替えてください。
- 予約サイトURLは自分のアフィリエイトURLに差し替えてください。
- サイトURLが `https://kyushu-family-trip-navi.pages.dev` 以外の場合は、`sitemap.xml` と canonical を適宜変更してください。
