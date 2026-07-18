# SALES_COUNTER

訪問営業の移動・休憩・ファネルを時刻付きで記録するタップカウンター（スマホ向け Web アプリ）。

- インターホン → インターホン応答 → 新規接触 → 再訪接触 → 拒否クローズ → アポ取得 → アポ訪問 → プレゼン前拒否 → プレゼン → プレゼン後拒否 → セールス
- オフィス出発 / 現場到着 / 現場出発 / オフィス到着
- 休憩開始 / 休憩終了
- インターホンでは新規・既加入を選択し、時刻とともに履歴へ保存
- 新規接触・再訪接触では年代を選択し、時刻とともに履歴へ保存
- プレゼンでは場所（玄関外・玄関内・宅内）を選択し、時刻とともに履歴へ保存
- 3種類の拒否では拒否理由を選択し、「その他」は自由入力して履歴へ保存
- 履歴ログを整形してクリップボードへコピー
- タップするだけで日次のファネル数値を記録
- 履歴表示 / 全リセット / 直前の 1 タップを取り消し
- localStorage 永続化、オフラインでも動く

## Live

https://gridatlas.github.io/SALES_COUNTER/

## 技術スタック

Next.js 14 (App Router, static export) / TypeScript / Tailwind CSS / Zustand + persist / lucide-react

## 開発

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # 静的エクスポート → out/
```

## デプロイ

`main` に push すると GitHub Actions が `out/` を GitHub Pages に自動デプロイ（`.github/workflows/deploy.yml`）。

## 削除運用

localStorage キー: `sales-counter-store`。ブラウザの開発者ツール → Application → Local Storage から手動削除も可能。
