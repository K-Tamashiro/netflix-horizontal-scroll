# 🎬 Netflix Shift+Wheel & MX MASTER Horizontal Scroll

Netflixの作品一覧（行・カルーセル）を、キーボードの **Shift + 縦ホイール** や **MX MASTER などのサイドホイール（横スクロール）** で直感的に横スクロールできるようにする Tampermonkey 用ユーザースクリプトです。

---

## ✨ 主な機能

* 🎬 **最新 Netflix UI 対応**
  * クラス名の変更や `data-uia` 属性ベースの最新カルーセル構造に対応しています。
* 🖱️ **MX Master 慣性・暴走対策**
  * 高機能マウス（MX Masterシリーズなど）のサイドホイールで発生しやすい「回しすぎて数ブロック滑ってしまう問題」を防ぐ連打制御（クールダウン）を搭載。
* ⚡ **Shift + 縦ホイールで高速移動**
  * 縦ホイールとShiftキーの組み合わせで、レスポンス良くサクサク行移動が可能です。
* 👁️ **スクロール中のサムネイル自動隠蔽**
  * スクロール中に拡大カード（ポップアッププレビュー）が被さって視界を遮らないよう、一時的に強制非表示にします。
* 🔄 **自動アップデート対応**
  * Netflix側のUIが再度変更された場合でも、Tampermonkeyを通じて最新版に自動更新されます。

---

## 📥 インストール方法

1. ブラウザに拡張機能 [Tampermonkey](https://www.tampermonkey.net/) をインストールします。
2. 以下のリンクをクリックすると、Tampermonkey のインストール画面が開きます。
   * 👉 **[スクリプトをインストール (v3.0)](https://raw.githubusercontent.com/zebrasoft/netflix-horizontal-scrol/main/netflix-scroll.user.js)**
3. **「インストール」**（または「更新」）ボタンをクリックすれば完了です。

---

## 🚀 使い方

Netflix (`https://www.netflix.com/`) を開き、作品の行の上にマウスカーソルを乗せて以下の操作を行います。

| 操作 | 動作 |
| :--- | :--- |
| **Shift + 縦ホイール** | 直感的なスピードで横スクロールします |
| **サイドホイール（水平ホイール）** | 1カチッ（1回回す）ごとにピタッと1ブロックずつスクロールします |

---

## 📜 更新履歴

* **v3.0**
  * Netflixの最新UI（`carousel-scroller` / `carousel-right-button`）への完全対応。
  * MX Master サイドホイールの慣性対策（クールダウン時間の設定）を導入。
  * GitHubによる自動アップデート機能（`@updateURL` / `@downloadURL`）に対応。

---

## 📄 ライセンス

MIT License / Author: Tamayan (zebrasoft)
