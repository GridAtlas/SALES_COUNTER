# SALES_COUNTER

訪問営業ファネル 7 段のタップカウンター（スマホ向け Web アプリ）。

- インターホン → 新規接触 → 再訪接触 → アポ取得 → アポ訪問 → プレゼン → セールス
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
