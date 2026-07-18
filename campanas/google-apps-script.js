/**
 * SAVAYA — Registro de leads en Google Sheets (una pestaña por campaña)
 *
 * Cada campaña (el valor de CAMPAIGN en el index.html de esa campaña) obtiene
 * automáticamente su propia pestaña dentro de esta misma hoja de cálculo.
 * Si la pestaña no existe todavía, se crea sola con sus encabezados la primera
 * vez que llega un lead de esa campaña — no hay que crear nada a mano.
 *
 * Cómo instalarlo (primera vez):
 * 1. Crea una hoja de cálculo nueva en Google Sheets (o usa una existente).
 * 2. Menú "Extensiones" → "Apps Script".
 * 3. Borra el contenido de ejemplo y pega TODO este archivo.
 * 4. Guarda (icono de disquete).
 * 5. Botón "Implementar" (Deploy) → "Nueva implementación" (New deployment).
 *    - Tipo: "Aplicación web" (Web app)
 *    - Ejecutar como: "Yo" (tu cuenta)
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone)
 * 6. Autoriza los permisos que pida Google (es tu propia hoja, es seguro).
 * 7. Copia la URL que te da ("URL de la aplicación web") y pásasela a Claude
 *    para configurarla como LEAD_WEBHOOK_URL en Vercel.
 *
 * Cómo actualizarlo cuando el código cambia (como ahora):
 * 1. Reemplaza el contenido del editor de Apps Script por este archivo y guarda.
 * 2. Botón "Implementar" → "Gestionar implementaciones" (Manage deployments).
 * 3. Click en el lápiz (editar) de la implementación existente.
 * 4. En "Versión", elige "Nueva versión" (New version) y dale "Implementar".
 *    (Si solo guardas el código sin hacer este paso, la URL sigue sirviendo
 *    la versión vieja — este paso es el que realmente la actualiza.)
 * 5. La URL del webhook NO cambia, así que no hay que tocar nada en Vercel.
 */

var HEADERS = [
  'Fecha', 'Nombre', 'Email', 'Ciudad', 'WhatsApp',
  'Origen', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Anuncio',
  'Plataforma', 'Dispositivo'
];

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateCampaignSheet(ss, data.campaign);

  ensureHeaders(sheet);

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name || '',
    data.email || '',
    data.city || '',
    data.whatsapp || '',
    data.source || '',
    (data.utm && data.utm.utm_source) || '',
    (data.utm && data.utm.utm_medium) || '',
    (data.utm && data.utm.utm_campaign) || '',
    (data.utm && data.utm.utm_content) || '',
    data.platform || '',
    data.device || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Agrega encabezados que faltan en hojas que ya existían antes de esta actualización
function ensureHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < HEADERS.length) {
    for (var i = lastCol; i < HEADERS.length; i++) {
      sheet.getRange(1, i + 1).setValue(HEADERS[i]).setFontWeight('bold');
    }
    sheet.autoResizeColumns(lastCol + 1, HEADERS.length - lastCol);
  }
}

function getOrCreateCampaignSheet(ss, campaignName) {
  var name = sanitizeSheetName(campaignName);
  // Bloqueo para evitar que dos leads simultáneos de una campaña nueva
  // intenten crear la misma pestaña dos veces a la vez.
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, HEADERS.length);
    }
    return sheet;
  } finally {
    lock.releaseLock();
  }
}

function sanitizeSheetName(campaignName) {
  var name = String(campaignName || 'sin_campana').trim();
  // Los nombres de pestaña no pueden tener: [ ] * ? / \ : ni empezar/terminar con apóstrofe, máx. 100 caracteres.
  name = name.replace(/[\[\]\*\?\/\\:]/g, '-').replace(/^'+|'+$/g, '');
  return name.slice(0, 90) || 'sin_campana';
}
