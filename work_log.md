# Crimson Lau — 技術成長日誌

## [2026-06-11] — React + GAS 全棧整合、非線性 UI 狀態管理

### 本次工作內容
為 Design Flow Control（建造業設計提交管理系統）實作完整後端整合：Google Apps Script 作為 Web App 後端，實現文件上傳至 Google Drive、狀態同步至 Google Sheets、以及非線性步驟進度追蹤 UI。

### 技術成長記錄

**新學 / 深化理解：**
- **GAS Web App (doGet/doPost)**：以 JSON ContentService 回應作 REST API；doPost 處理 base64 檔案上傳，doGet 提供 getFile/getState endpoint
- **Google Drive API via GAS**：DriveApp.getFolderById、遞迴 getOrCreateFolder 建立 projectId/packageId/submissionId 層次資料夾結構、file.setSharing(ANYONE_WITH_LINK, VIEW)
- **Blob URL 檔案下載**：Utilities.base64Encode → 前端 atob → Uint8Array → Blob → URL.createObjectURL → 動態 <a> 點擊下載，解決 Preview 面板無法打開 Drive URL 的問題
- **IndexedDB fallback**：當 GAS 不可用時，前端以 IndexedDB 儲存 base64 檔案，保持離線功能
- **React Context + Set<number> 狀態**：用 Set<number> 追蹤「曾有操作的步驟」，實現非線性藍色外框 UI，避免線性 boolean array 的局限
- **Claude Code Skill 系統**：SKILL.md frontmatter 結構、三層載入機制（metadata / body / resources）、skill 觸發描述設計

**問題解法：**
- @rollup/rollup-win32-x64-msvc 找不到 → 刪除 node_modules + package-lock.json，用 portable npm 重新安裝
- Switch case 重複 const 宣告報錯 → 將共用 function 從 case 內部移至 case 頂部宣告，避免同一 switch 作用域衝突
- Google Drive URL 在 Claude Preview 被封鎖 → 加 GAS getFile endpoint，前端改用 base64 blob 方式下載

**架構 / 設計決策：**
- 13 步驟合併為 11 步（Tab switcher 模式）— 原因：Step 5/6 和 Step 7/8 各自高度相關，合併後減少 UI 跳轉，視覺更平衡
- 非線性步驟用 Set<number> 而非 completed[] boolean array — 原因：現實工作流中步驟可以跳躍激活，Set 語義更正確

### 可複用的知識點
1. GAS base64 upload + blob download 是解決 CORS / Drive Preview 問題的標準模式
2. React switch-case 中若有共用 function，宣告必須放在第一個相關 case 頂部
3. Claude Code 全域設定在 ~/.claude/CLAUDE.md，專案記憶在 ~/.claude/projects/.../memory/

## [2026-06-13 00:00]
- 建立全域 skill `~/.claude/skills/gstack-index/SKILL.md`：gstack 所有 skill 的索引目錄，按設計/規格/審查/部署/回顧分類
- 在全域 CLAUDE.md 加入一行主動建議規則：當任務涉及設計、QA、部署等場景時，主動提示對應 gstack skill
- 設計決策：skill description 欄位寫得夠廣，確保 Claude 在合適情境自動觸發；CLAUDE.md 只加一行，保持輕量
