// 這是 Google Apps Script 的範例程式碼 (Code.gs)
// 用於將前端傳來的資料寫入 Google Sheets，或處理檔案上傳。

const SHEET_NAME = 'AuditTrail';

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = JSON.parse(e.postData.contents);
    
    // 如果是上傳檔案 (Base64)
    if (data.type === 'upload') {
      const folder = DriveApp.getFolderById('YOUR_FOLDER_ID_HERE'); // 請填入 Google Drive 資料夾 ID
      const blob = Utilities.newBlob(Utilities.base64Decode(data.fileBase64), data.mimeType, data.fileName);
      const file = folder.createFile(blob);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        fileUrl: file.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 一般寫入資料 (Audit Trail / Form Data)
    // 假設 data 有: projectCode, step, role, action, timestamp
    sheet.appendRow([
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
  // 處理 GET 請求，例如讀取某些狀態
  return ContentService.createTextOutput(JSON.stringify({ status: 'connected' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 必須加上此函數處理 CORS Preflight 請求
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}
