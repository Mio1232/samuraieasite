# 無料EA配布サイト

XM / HFM のIB経由で無料EAを配布するための静的サイトです。LINEリッチメニューからのリンク先を想定しています。

## ページ構成（リッチメニュー6ボタンに対応）

| ファイル | 内容 | リッチメニュー |
|---|---|---|
| `index.html` | EA紹介・実績・全体の流れ | ① ホーム |
| `account.html` | XM/HFM比較・口座開設手順 | ② 口座開設 |
| `install.html` | MT4/MT5へのEA導入手順 | ③ 導入方法 |
| `settings.html` | 推奨ロット・パラメータ・VPS | ④ 稼働設定 |
| `faq.html` | よくある質問 | ⑤ FAQ |
| `support.html` | EA受け取り・問い合わせ・更新履歴 | ⑥ サポート |
| `legal.html` | 免責事項・特商法表記（フッターリンク） | — |

## 公開前に置き換える項目（`【 】` 部分）

サイト内の `【 】` で囲まれた箇所はすべてプレースホルダーです。検索して置き換えてください。

- `【EA名】` … EAの名称
- `【XMのIBリンクを入力】` / `【HFMのIBリンクを入力】` … アフィリエイト（IB）リンク
- `【公式LINEのURLを入力】` … 公式LINEのURL
- `【運営者名】` … 運営者・屋号
- 実績数値（勝率・PF・最大DD など）、推奨ロット表、パラメータ説明
- 各ステップの `【スクリーンショット】` … `assets/img/` に画像を入れ、`<div class="shot">…</div>` を `<img src="assets/img/xxx.png" alt="…">` に差し替え

## GitHub → Netlify デプロイ手順

1. このフォルダをGitHubリポジトリにプッシュ
   ```
   git init
   git add .
   git commit -m "init ea site"
   git branch -M main
   git remote add origin https://github.com/ユーザー名/リポジトリ名.git
   git push -u origin main
   ```
2. Netlify にログイン → **Add new site → Import an existing project**
3. GitHubリポジトリを選択
4. ビルド設定は空でOK（静的サイトのため）
   - Build command: （空欄）
   - Publish directory: `.`（ルート）
5. Deploy を実行 → 発行されたURLをLINEリッチメニューに設定

## リッチメニューのリンク設定例

各ボタンに以下を割り当てます（`https://あなたのサイト.netlify.app/` の後にファイル名）。

- ホーム → `/` または `/index.html`
- 口座開設 → `/account.html`
- 導入方法 → `/install.html`
- 稼働設定 → `/settings.html`
- FAQ → `/faq.html`
- サポート → `/support.html`

## 注意（コンプライアンス）

- XM・HFMは日本の金融庁に無登録の海外業者です。国内居住者への勧誘表現は金融商品取引法上リスクがあります。
- 「絶対」「必ず」「元本保証」などの断定的表現は使わないでください。
- 実績は必ず検証期間・条件を明記し、「過去の実績は将来を保証しない」旨を添えてください。
- 収益化を本格化する前に、必要に応じて専門家へご相談ください。
