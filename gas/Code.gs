// 這是 Google Apps Script 的程式碼 (Code.gs)
// 用於將前端傳來的資料寫入 Google Sheets，包含 AuditTrail 與狀態存儲功能。

const SPREADSHEET_ID = ''; // 如果您是建立獨立的 Apps Script 腳本，請在此填入您的 Google 試算表 ID（網址中 /d/ 後面那一長串字元）

const AUDIT_SHEET_NAME = 'AuditTrail';
const STATE_SHEET_NAME = 'ProjectState';

function getSpreadsheet() {
  let ss = null;
  if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID !== '') {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      // 忽略
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!ss) {
    throw new Error('無法定位 Google 試算表。如果您是建立獨立 (Standalone) 的 Apps Script 腳本，請務必在 Code.gs 頂部的 SPREADSHEET_ID 填入您的試算表 ID！');
  }
  return ss;
}

function doPost(e) {
  try {
    const ss = getSpreadsheet();
    const data = JSON.parse(e.postData.contents);
    
    // 如果是上傳檔案 (Base64)
    if (data.type === 'upload') {
      const ROOT_FOLDER_ID = '1NfcOhdGT2N0bg9VhY__5aXLbPh3yF8bf';

      // 輔助函數：在父文件夾中取得或建立子文件夾
      function getOrCreateFolder(parent, name) {
        const iter = parent.getFoldersByName(name);
        return iter.hasNext() ? iter.next() : parent.createFolder(name);
      }

      let folder;
      try {
        const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
        // 按 projectId > packageId > submissionId 建立層次結構
        const projectFolder = data.projectId ? getOrCreateFolder(root, data.projectId) : root;
        const packageFolder = data.packageId ? getOrCreateFolder(projectFolder, data.packageId) : projectFolder;
        folder = data.submissionId ? getOrCreateFolder(packageFolder, data.submissionId) : packageFolder;
      } catch (err) {
        folder = DriveApp.getRootFolder();
      }

      const blob = Utilities.newBlob(Utilities.base64Decode(data.fileBase64), data.mimeType, data.fileName);
      const file = folder.createFile(blob);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        // 忽略可能的權限設定異常
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        fileUrl: file.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 保存完整狀態 (NoSQL JSON Document 模式)
    if (data.action === 'saveState') {
      let stateSheet = ss.getSheetByName(STATE_SHEET_NAME);
      if (!stateSheet) {
        stateSheet = ss.insertSheet(STATE_SHEET_NAME);
        stateSheet.appendRow(['ProjectKey', 'StateJSON', 'LastUpdated']);
      }
      
      const key = `${data.projectId}_${data.packageId}_${data.submissionId}`;
      const stateJSON = JSON.stringify(data.stateData);
      const now = new Date();
      
      const rows = stateSheet.getDataRange().getValues();
      let foundIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === key) {
          foundIndex = i + 1; // 1-indexed for sheets
          break;
        }
      }
      
      if (foundIndex > -1) {
        stateSheet.getRange(foundIndex, 2).setValue(stateJSON);
        stateSheet.getRange(foundIndex, 3).setValue(now);
      } else {
        stateSheet.appendRow([key, stateJSON, now]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 一般寫入 AuditTrail 記錄
    let auditSheet = ss.getSheetByName(AUDIT_SHEET_NAME);
    if (!auditSheet) {
      auditSheet = ss.insertSheet(AUDIT_SHEET_NAME);
      auditSheet.appendRow(['ProjectCode', 'Step', 'Role', 'Action', 'Timestamp']);
    }
    auditSheet.appendRow([
      data.projectCode || '',
      data.step || '',
      data.role || '',
      data.action || '',
      data.timestamp || new Date()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const ss = getSpreadsheet();
    
    // 讀取特定項目的狀態
    if (e.parameter.action === 'getState') {
      const projectId = e.parameter.projectId;
      const packageId = e.parameter.packageId;
      const submissionId = e.parameter.submissionId;
      const key = `${projectId}_${packageId}_${submissionId}`;
      
      const stateSheet = ss.getSheetByName(STATE_SHEET_NAME);
      if (stateSheet) {
        const rows = stateSheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === key) {
            return ContentService.createTextOutput(JSON.stringify({
              status: 'success',
              stateData: JSON.parse(rows[i][1])
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'not_found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 以 base64 回傳 Google Drive 文件內容
    if (e.parameter.action === 'getFile') {
      const fileId = e.parameter.fileId;
      if (!fileId) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Missing fileId' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const file = DriveApp.getFileById(fileId);
      const blob = file.getBlob();
      const base64Content = Utilities.base64Encode(blob.getBytes());
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        fileName: file.getName(),
        mimeType: blob.getContentType(),
        base64Content: base64Content
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'connected' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 必須加上此函數處理 CORS Preflight 請求
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}
