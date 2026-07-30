# samurai EA サイト｜GitHub → Netlify デプロイ手順

このフォルダはそのまま公開できる「静的サイト」です。ビルド作業は不要で、
ファイルをアップロードするだけで公開できます。外部ライブラリ依存もありません。

---

## フォルダの中身

```
ea-site/
├─ index.html          （ホーム）
├─ account.html        （口座開設）
├─ install.html        （導入方法・MT4）
├─ settings.html       （稼働設定・資金管理）
├─ faq.html            （よくある質問）
├─ support.html        （EA受け取り・サポート・オープンチャット）
├─ legal.html          （免責・プライバシー）
├─ assets/
│   ├─ css/style.css
│   └─ js/hero-gl.js, main.js
├─ netlify.toml        （公開設定・セキュリティヘッダー）
├─ robots.txt
└─ README.md
```

---

## 方法A：GitHub 経由でデプロイ（推奨・更新がラク）

### 1. GitHub にリポジトリを作る
1. GitHub にログイン →「New repository」。
2. 名前を付けて（例：`samurai-ea-site`）、Public か Private を選び「Create repository」。

### 2. ファイルをアップロード
- 画面の「uploading an existing file」から、この `ea-site` フォルダの**中身**（index.html などの一式）をドラッグ＆ドロップ →「Commit changes」。
- ※ `ea-site` フォルダごとではなく、**中身**を置いてください（index.html がリポジトリ直下に来るように）。

### 3. Netlify に接続
1. https://app.netlify.com にログイン（GitHub アカウントでログイン可）。
2. 「Add new site」→「Import an existing project」→「Deploy with GitHub」。
3. 先ほどのリポジトリを選択。
4. ビルド設定は次のとおり（`netlify.toml` があるので基本そのままでOK）：
   - **Build command**：空欄
   - **Publish directory**：`.`（ルート）
5. 「Deploy site」を押すと公開されます。

### 4. 公開URL
- `https://ランダム名.netlify.app` が発行されます。
- サイト名は Site settings →「Change site name」で変更可能（例：`samurai-ea.netlify.app`）。
- 独自ドメインを使う場合は Domain settings から設定できます（任意）。

### 更新のしかた
- GitHub のファイルを変更（push）すると、Netlify が自動で再公開します。

---

## 方法B：Netlify Drop（GitHub 不要・最速）

1. https://app.netlify.com/drop を開く。
2. この `ea-site` フォルダ（または中身一式）を**ドラッグ＆ドロップ**。
3. すぐに公開URLが発行されます。

※ 更新のたびにドラッグ＆ドロップし直す必要があります。継続運用は方法Aが便利です。

---

## 公開後のチェックリスト

- [ ] スマホ（できれば LINE アプリ内ブラウザ）で表示・動作を確認
- [ ] 各リンクが正しく開くか
  - EA ダウンロード（Google Drive）
  - XM 新規／追加口座、HFM 口座開設
  - ABLENET VPS
  - 公式 LINE（口座番号の連絡先）
  - オープンチャット
- [ ] ヒーローの流体アニメーションが表示されるか（非対応環境ではCSS背景に自動フォールバック）

## 後日の差し替え予定（現在ダミー）

- 実績数値（勝率・PF・最大DD・総取引数・検証期間）… `index.html` の `data-to` を実数に
- 資産推移グラフ … `assets/js/main.js` の `EQUITY` 配列を実データに
- 一部スクリーンショット箇所の目安時間・VPS設定記事リンク

---

## 補足

- HTTPS は Netlify が自動で付与します。
- `netlify.toml` で公開ディレクトリと基本的なセキュリティヘッダーを設定済みです。
- LINE の Google Drive ダウンロードは「リンクを知っている全員」共有になっているか、公開前に一度確認してください。
