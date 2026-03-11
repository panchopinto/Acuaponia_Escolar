const SHEET_NAME = 'Registros';

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'Apps Script operativo' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'timestamp',
        'fecha',
        'curso',
        'equipo',
        'tempAgua',
        'tempAmbiente',
        'alimentacion',
        'peces',
        'plantas',
        'observaciones'
      ]);
    }

    const data = JSON.parse(e.postData.contents || '{}');

    sheet.appendRow([
      new Date(),
      data.fecha || '',
      data.curso || '',
      data.equipo || '',
      data.tempAgua || '',
      data.tempAmbiente || '',
      data.alimentacion || '',
      data.peces || '',
      data.plantas || '',
      data.observaciones || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
