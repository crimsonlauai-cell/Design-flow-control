# Design Flow Control System (工程設計流程控制系統)

這是一個專為大型工程專案設計的流程管理系統，基於 **Vite + React** 構建。系統核心價值在於透過 13 個嚴謹的步驟，確保設計文件的版本控管、跨部門協調 (R to C)、以及與法定審批 (Statutory Submission) 的緊密連動。

---

## 🚀 快速啟動指南

### 1. 基礎安裝
```powershell
# 安裝依賴套件
npm install

# 啟動開發伺服器
npm run dev
```

### 2. 環境變數設定 (Google Sheets 整合)
系統使用 Google Apps Script 作為輕量級後端來記錄審計日誌 (Audit Trail)。
1. 複製 `.env.sample` 並更名為 `.env`。
2. 依照 `gas/Code.gs` 的說明部署 Google Apps Script。
3. 將部署後的 Web App URL 填入 `.env` 中的 `VITE_GAS_API_URL`。

---

## 🛠️ 核心功能指引：13 步驟操作流程

本系統採用「角色權限分級制」，建議在操作時透過右上角的 **Role Switcher** 切換角色（如 Design, PM, QS 等）以體驗完整流程。

### 第一階段：專案初始化與設定 (Setup)

#### **步驟 1: Project Information (專案基本資料)**
*   **目的**：建立專案的身分證。
*   **操作**：填寫專案編號、中英文名稱、合約工期、地理位置（含 Google Maps 連結）及主要持分者（Client, Consultant）。
*   **關鍵**：此處填寫的顧問公司名稱將自動帶入後續的表單中。

#### **步驟 2: Stakeholder & Timeline (持分者與工期排程)**
*   **目的**：定義各部門負責人與專案里程碑。
*   **操作**：
    1. 指派 PD, EIC, PIC 等核心成員。
    2. 針對不同工程範疇（Foundation, Pile Cap, ELS 等）設定預計起迄日期。

#### **步驟 3: Submission Schedule (提交計畫表)**
*   **目的**：規劃具體的 Package 提交節點。
*   **操作**：設定目標提交日期（Submission Date）。若勾選 "First Submission"，系統會自動計算 2 個月的審批期；否則預設為 1 個月。

---

### 第二階段：設計開發與內部協調 (Internal Phase)

#### **步驟 4: Design Input (設計輸入記錄)**
*   **限 Design 角色**：記錄從客戶或顧問端收到的原始資料。
*   **操作**：上傳 DWG, PDF 等素材，並標註來源與收件日期。

#### **步驟 5: Internal Draft Issuance (內部草案發佈)**
*   **限 Design 角色**：發佈內部審閱版本（D0, D1...）。
*   **操作**：上傳草案後，點擊 **"Notify Reviewers"** 觸發跨部門審閱機制。

#### **步驟 6: Internal Review & Coordination (內部審閱與 R to C)**
*   **目的**：解決跨部門（QS, Site, Procurement）對設計的疑問。
*   **操作**：
    1. 其他部門針對特定的 Draft 版本提出 Comment。
    2. 設計部（Design）針對 Comment 進行回覆（Reply），支援圖片附件。

---

### 第三階段：外部提交與審批 (Submission Phase)

#### **步驟 7: Formal Consultant Submission (正式提交顧問)**
*   **目的**：凍結設計版本並正式發函（C1, C2...）。
*   **操作**：填寫 Transmittal Ref No. 並上傳正式文件，記錄透過 Aconex 或其他平台的發放軌跡。

#### **步驟 8: Consultant Feedback Log (顧問意見記錄)**
*   **目的**：追蹤顧問回傳的 Mark-ups。
*   **操作**：記錄收件日期、上傳標註過的 PDF，並針對建議進行內部回覆。

#### **步驟 9: Statutory Submission Tracking (法定入則追蹤)**
*   **目的**：監控政府部門（如 BD, ASD）的入則進度。
*   **操作**：
    1. 勾選確認 "Consultant R to C Table" 已完成。
    2. 記錄提交日期，系統將根據 Package 類型自動計算 **Est. Due Date**（法定回覆期限）。
    3. 可開啟「7天前自動提醒」功能。

#### **步驟 10: Authority Comment Processing (政府部門意見處理)**
*   **目的**：記錄 BD/GEO 等部門的正式意見。
*   **操作**：類似步驟 8，但專注於權威機構的反饋，這是邁向獲准的關鍵。

---

#### **步驟 11: Final Response Submission (最終回覆提交)**
*   **目的**：提交針對權威機構意見的最終修正。
*   **操作**：分別上傳 **DRAWINGS** 與 **REPORT**，並填寫提交圖則的總數量。

#### **步驟 12: Approval & Record Register (批核與正式紀錄登記)**
*   **目的**：系統的「最終真相來源」(Single Source of Truth)。
*   **操作**：
    1. 選擇批核狀態：`Approved`, `Approved with conditions`, `Withdraw and Resubmission`, `Disapproval` 等。
    2. 上傳 **Approval Letter** 及 **Approved Drawings**。
    3. 點擊 **"Broadcast Result"** 通知全體成員。

---

### 第四階段：監控與分析

#### **步驟 13: Quantity & Cost Tracking (工程量與成本連動)**
*   **目的**：即時反應設計變更對商務的影響。
*   **操作**：記錄設計修訂導致的鋼材噸數增加、工期延誤等影響，維持 Cost Trend 的準確性。

---

## 🎨 設計美學與技術特點
*   **Glassmorphism UI**：採用半透明毛玻璃質感與現代感的 HSL 色調。
*   **Framer Motion**：順滑的步驟切換動畫與側邊欄伸縮效果。
*   **Responsive Layout**：完美適配桌面端與平板端操作。

---

## 📝 授權說明
本專案僅供工程設計管理示範使用。如有技術問題請聯繫系統管理員。
