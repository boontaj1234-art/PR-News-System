const FOLDER_ID = "1oXGNzc2dUCEwYmzwazItkc_ksS6GnDXK";
const SHEET_ID = "12L9qwqTbUwy5vIB8S3uzZDr7poB7iIo6ZMqlYrolniw";
const MONTH_NAMES = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  if (action === "login") {
    const username = e.parameter.username;
    const password = e.parameter.password;
    const sheet = ss.getSheetByName("accounts");
    if (!sheet) return JSON_RESPONSE({ status: "error", message: "Sheet 'accounts' not found" });
    
    const data = sheet.getDataRange().getValues();
    data.shift(); // remove header
    
    const user = data.find(row => row[0] == username && row[1] == password);
    if (user) {
      return JSON_RESPONSE({ status: "success", user: { username: user[0], name: user[2] || user[0] } });
    } else {
      return JSON_RESPONSE({ status: "error", message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }
  }

  // Aggregate data from all monthly sheets
  const sheets = ss.getSheets();
  let allData = [];
  
  sheets.forEach(sheet => {
    const name = sheet.getName();
    // Check if sheet name matches "Month Year" pattern
    const isMonthlySheet = MONTH_NAMES.some(m => name.startsWith(m));
    
    if (isMonthlySheet) {
      const data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        const headers = data.shift();
        const rows = data.map(row => {
          let obj = {};
          headers.forEach((header, i) => {
            obj[header] = row[i];
          });
          return obj;
        });
        allData = allData.concat(rows);
      }
    }
  });
  
  return JSON_RESPONSE(allData);
}

function JSON_RESPONSE(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const action = params.action || "add";
    
    // Determine target sheet name from date
    const dateObj = parseDate(params.date);
    const targetSheetName = MONTH_NAMES[dateObj.getMonth()] + " " + (dateObj.getFullYear() + 543);
    const sheet = getOrCreateDataSheet(ss, targetSheetName);
    
    // 1. จัดการรูปภาพ
    let imageUrl = params.image_url || "";
    if (params.image && params.image.data) {
      // --- ลบภาพเดิมใน Drive (ถ้ามี) เพื่อป้องกันซ้ำซ้อน ---
      if (imageUrl.includes("googleusercontent.com/d/") || imageUrl.includes("id=")) {
        const oldFileIdMatch = imageUrl.match(/d\/([^/&?]+)/) || imageUrl.match(/id=([^&]+)/);
        if (oldFileIdMatch && oldFileIdMatch[1]) {
          try {
            DriveApp.getFileById(oldFileIdMatch[1]).setTrashed(true);
          } catch (e) {
            console.log("Could not delete old file: " + e.toString());
          }
        }
      }

      const folder = getMonthFolder(params.date);
      // ตั้งชื่อไฟล์ตามชื่อเรื่อง + นามสกุลเดิม
      const ext = params.image.name.split('.').pop();
      const cleanTitle = (params.title || "image").replace(/[/\\?%*:|"<>]/g, '-');
      const fileName = cleanTitle + "." + ext;
      
      const blob = Utilities.newBlob(Utilities.base64Decode(params.image.data), params.image.mimeType, fileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      imageUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
    } else if (imageUrl.includes("drive.google.com/uc") || imageUrl.includes("drive.google.com/open")) {
      const match = imageUrl.match(/id=([^&]+)/) || imageUrl.match(/\/d\/([^/]+)/);
      if (match && match[1]) {
        imageUrl = "https://lh3.googleusercontent.com/d/" + match[1];
      }
    }

    // 2. ค้นหาและลบข้อมูลเดิม (Strict Overwrite) - Search in ALL monthly sheets
    const targetDocId = (params.doc_id || "").toString().trim();
    const oldDocId = (params.old_doc_id || "").toString().trim();
    
    if (targetDocId || oldDocId) {
      const allSheets = ss.getSheets();
      allSheets.forEach(s => {
        const sName = s.getName();
        if (MONTH_NAMES.some(m => sName.startsWith(m))) {
          const range = s.getDataRange();
          const displayValues = range.getDisplayValues(); 
          for (let i = displayValues.length - 1; i >= 1; i--) {
            const rowDocId = displayValues[i][1].toString().trim();
            if (rowDocId === targetDocId || (oldDocId && rowDocId === oldDocId)) {
              s.deleteRow(i + 1);
            }
          }
        }
      });
    }

    if (action === "delete") return JSON_RESPONSE({ status: "success", message: "ลบข้อมูลเรียบร้อย" });

    // 3. เพิ่มข้อมูลใหม่ลงในชีทประจำเดือน
    const lastRow = sheet.getLastRow();
    let nextNo = 1;
    if (lastRow > 0) {
      const lastVal = sheet.getRange(lastRow, 1).getDisplayValue();
      const match = lastVal.match(/\d+/);
      nextNo = match ? parseInt(match[0]) + 1 : lastRow + 1;
    }
    
    sheet.appendRow([
      "ที่" + nextNo,
      targetDocId,
      params.date,
      params.title,
      params.content || "",
      imageUrl,
      params.note
    ]);
    
    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat("@");
    
    return JSON_RESPONSE({ 
      status: "success", 
      message: action === "edit" ? "แก้ไขข้อมูลเรียบร้อยแล้ว" : "เพิ่มข้อมูลเรียบร้อยแล้ว",
      imageUrl: imageUrl 
    });
      
  } catch (err) {
    return JSON_RESPONSE({ status: "error", message: err.toString() });
  }
}

function parseDate(dateStr) {
  let date;
  if (dateStr && dateStr.includes('-')) {
    date = new Date(dateStr);
  } else if (dateStr && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let year = parseInt(parts[2]);
      if (year > 2400) year -= 543;
      date = new Date(year, parts[1] - 1, parts[0]);
    }
  }
  if (!date || isNaN(date.getTime())) date = new Date();
  return date;
}

function getOrCreateDataSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["ที่", "เลขที่", "วัน/เดือน/ปี", "เรื่อง/กิจกรรม", "เนื้อข่าว", "รูป", "หมายเหตุ"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f4f6");
    sheet.getRange("B:B").setNumberFormat("@");
  }
  return sheet;
}

function getMonthFolder(dateStr) {
  const rootFolder = DriveApp.getFolderById(FOLDER_ID);
  const date = parseDate(dateStr);
  const folderName = MONTH_NAMES[date.getMonth()] + " " + (date.getFullYear() + 543);
  
  const folders = rootFolder.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return rootFolder.createFolder(folderName);
}
