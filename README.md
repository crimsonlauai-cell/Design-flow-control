# Design Flow Control System

這是一個基於 Vite + React 的工程管理系統前端，具備 13 步流程控制與 Google Sheets / Apps Script 的整合。

## Setup 指南

1. **安裝依賴**:
   ```bash
   npm install
   ```

2. **設定環境變數**:
   複製 `.env.sample` 並重新命名為 `.env`，填寫您的 Google Apps Script 部署 URL。
   ```bash
   cp .env.sample .env
   ```

3. **Google Apps Script (GAS) API 設定**:
   - 開啟 Google Drive，建立一個新的 Google Sheets，命名為 `AuditTrail`。
   - 點擊「擴充功能」 -> 「Apps Script」。
   - 將專案中 `gas/Code.gs` 的內容複製貼上。
   - 點擊「部署」 -> 「新增部署」，選擇「網頁應用程式」，將存取權限設為「所有人」。
   - 複製 Web App URL，貼入 `.env` 的 `VITE_GAS_API_URL` 中。

4. **啟動開發伺服器**:
   ```bash
   npm run dev
   ```

## 13 步驟圖解 (核心流程)

| 步驟 | 名稱 | 負責角色 | Output |
|------|------|----------|--------|
| 1 | Project Initiation | PM, Tender | Kick-off doc |
| 2 | Stakeholder & Timeline | Design, PM, Tender | 完整 Project Profile |
| 3 | Submission Schedule | Design, PM | Package Schedule & Reminder Rules |
| 4 | Design Input | Design | Input 素材記錄與版控 |
| 5 | Internal Draft | Design, All | 內部協作 Draft (D0, D1) |
| 6 | Internal Review | All | 跨部門 R to C (Comment List) |
| 7 | Formal Submission | Design, PM | 凍結版本 (C1, C2) Issued 記錄 |
| 8 | Consultant Feedback | Design, PM | 接收並記錄外部 Comment |
| 9 | Statutory Tracking | Design, PM | 記錄入則狀態與提醒 |
| 10 | Authority Comment | Design, PM | 政府部門 (BD/GEO) R to C 記錄 |
| 11 | Final Response | Design, PM | 上傳最後修正版本 |
| 12 | Approval Register | All | 批核狀態 (Single Source of Truth) |
| 13 | Quantity & Cost | All | 設計與成本/工期連動趨勢 |

## 測試資料

- **Project Code**: T4079
- **角色模擬操作流程**: 您可以透過右上角的 Role Switcher 在 `Design`, `PM`, `QS`, `Procurement`, `Tender` 之間切換。
  - 例如，在 `Step 4 (Design Input)`，只有 `Design` 角色有權限上傳檔案，其他角色會看到權限限制的提示。
  - 在 `Step 6 (Internal Review)`，各部門可以新增 comment 進行跨部門協作。
