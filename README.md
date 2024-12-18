# RL Web Game

這是一個簡單的強化學習（Reinforcement Learning）網頁遊戲，旨在幫助使用者了解強化學習的基本概念和應用。遊戲中，代理將學習如何在給定的環境中達成目標，並獲得最高分數。

## 專案結構

- `src/index.html`：應用程式的主 HTML 檔案，包含遊戲的基本結構和元素，並引入 CSS 和 JavaScript 檔案。
- `src/style.css`：遊戲的樣式設定，定義了遊戲界面的外觀，包括顏色、字型和佈局。
- `src/game.js`：遊戲的邏輯和規則，負責管理遊戲狀態、分數計算、玩家操作以及破關條件的判斷。
- `src/rl_agent.js`：強化學習代理的定義，包含學習算法和策略，讓代理能夠根據遊戲狀態進行決策，並學習如何最快速地破關。
- `package.json`：npm 的配置檔，列出了專案的依賴項和腳本，方便管理和安裝所需的套件。
- `.gitignore`：列出了在版本控制中應該忽略的檔案和資料夾，例如 node_modules 和其他臨時檔案。

## 安裝與運行

1. 克隆此專案到本地：
   ```
   git clone <repository-url>
   ```

2. 進入專案目錄：
   ```
   cd rl-web-game
   ```

3. 安裝依賴項：

   PowerShell 
   ```
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned 
   ```
   ```
   npm install
   ```

4. 啟動遊戲：
   ```
   npm start
   ```

5. 在瀏覽器中打開 `http://localhost:3000` 來遊玩遊戲。

## 使用指南

- 遊戲開始後，代理將自動開始學習如何達成目標。
- 觀察代理的行為，並根據需要調整參數以改善學習效果。
- 目標是讓代理在最短的時間內達成最高分數。

## 貢獻

歡迎任何形式的貢獻！請提交問題或拉取請求。

## 授權

此專案採用 MIT 授權。詳情請參閱 LICENSE 檔案。