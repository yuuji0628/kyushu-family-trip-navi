v8.2.5｜画像内容そのものの重複判定

今回の強化:
- URLが違っても、画像データが同一なら同じ写真として削除
- Workerが画像データを取得してSHA-256ハッシュを作成
- 記事内で同じハッシュの2枚目以降を自動非表示
- URL/thumbnail/サイズ違いの従来重複判定も維持
- 既存D1記事にも表示時に適用
- 壊れた画像を楽天APIから復旧した後の写真にも適用
- 指紋結果はCloudflare Cacheへ保存し、毎回画像全体を再計算しない
- 12MBを超える画像は安全のため内容ハッシュ対象外

判定の段階:
1. URL・サイズ違いの重複を即時削除
2. 画像読み込み完了後、実データのSHA-256を比較
3. 同じ画像内容ならURLが別でも2枚目以降を削除

注意:
同じ写真を再圧縮・トリミング・色補正した別ファイルはSHA-256が変わるため、
完全な「見た目の類似画像認識」ではありません。
ただし今回のスクリーンショットのような、同じ元画像が別URLで重複するケースには有効です。

維持:
PHOTO DEDUPE / FRESH IMAGE REPAIR / SEO MAX / PHOTO-DRIVEN FAMILY /
Family Magazine / Nativeホテル検索 / Native Login / Native記事作成 /
Native削除 / GitHub ZIP / D1 / Cron

GitHubでは worker.js を置き換えてください。
反映後:
dashboard v8.2.5 / CONTENT HASH DEDUPE
