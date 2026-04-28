// ======================================================
// ย่างเนย ปิ่นเกล้า — แจ้งรายการซ่อม-ซื้ออุปกรณ์
// Apps Script — รองรับหลายรูปต่อช่อง
// ======================================================

const SHEET_NAME  = 'บันทึกข้อมูล';
const FOLDER_NAME = 'yangnoey-repair-photos';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const folder = getOrCreateFolder(FOLDER_NAME);
    const now    = new Date();
    const seq    = (sheet.getLastRow() < 2 ? 0 : sheet.getLastRow() - 1) + 1;

    // อัปโหลดรูปแต่ละกลุ่ม → คืน links คั่นด้วย newline
    const links1 = uploadImages(data.img1, folder, seq, 'before');
    const links2 = uploadImages(data.img2, folder, seq, 'after');
    const links3 = uploadImages(data.img3, folder, seq, 'receipt');

    sheet.appendRow([
      seq,
      Utilities.formatDate(now, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss'),
      data.date || '',
      data.mainCategory || '',
      data.subCategory  || '',
      data.details      || '',
      data.totalAmount  ? '฿' + data.totalAmount : '฿0',
      data.userName     || 'ไม่ระบุ',
      data.userId       || 'ไม่ระบุ',
      links1 || '(ไม่มีรูป)',
      links2 || '(ไม่มีรูป)',
      links3 || '(ไม่มีรูป)',
    ]);

    return jsonResponse({ status: 'success' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// อัปโหลด array ของรูป → คืน string ของ links คั่นด้วย newline
function uploadImages(imgs, folder, seq, label) {
  if (!imgs || !imgs.length) return '';
  const links = [];
  imgs.forEach((img, i) => {
    if (!img || !img.base64) return;
    try {
      const blob = Utilities.newBlob(
        Utilities.base64Decode(img.base64),
        img.type || 'image/jpeg',
        `${seq}_${label}_${i + 1}_${img.name || 'photo.jpg'}`
      );
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      links.push(file.getUrl());
    } catch (err) {
      links.push('(upload failed: ' + err.message + ')');
    }
  });
  return links.join('\n');
}

function getOrCreateFolder(name) {
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return jsonResponse({ status: 'ok', message: 'yangnoey repair API ready' });
}
