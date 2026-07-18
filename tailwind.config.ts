import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // 各アクティビティ色のトーンをまとめて Tailwind の色スケールで扱う。
        // 実際の背景色は bg-{color}-500 のように呼び出す。
      },
    },
  },
  plugins: [],
  // 動的クラス名 `bg-${color}-500` を使うため safelist に列挙。
  safelist: [
    {
      pattern: /bg-(slate|sky|indigo|amber|rose|orange|emerald|blue|cyan|violet|fuchsia|teal|zinc|red)-(50|100|500|600|700)/,
      variants: ['active'],
    },
    { pattern: /text-(slate|sky|indigo|amber|rose|orange|emerald|blue|cyan|violet|fuchsia|teal|zinc|red)-(50|100|500|600|700)/ },
    { pattern: /border-(slate|sky|indigo|amber|rose|orange|emerald|blue|cyan|violet|fuchsia|teal|zinc|red)-(100|200|300)/ },
  ],
};

export default config;
