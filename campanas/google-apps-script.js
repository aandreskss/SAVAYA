/**
 * SAVAYA — Registro de leads + ventas + asignación a vendedoras en Google Sheets
 *
 * Cada campaña (el valor de CAMPAIGN en el index.html) obtiene su propia pestaña.
 * Si la pestaña no existe, se crea sola con sus encabezados al primer lead.
 *
 * ── INSTALACIÓN (primera vez) ────────────────────────────────────────────────
 * 1. Crea una hoja de cálculo en Google Sheets (o usa la existente).
 * 2. Extensiones → Apps Script → borra el ejemplo → pega este archivo → Guarda.
 * 3. Implementar → Nueva implementación → tipo "Aplicación web"
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier usuario
 * 4. Autoriza los permisos. Copia la URL del webhook → LEAD_WEBHOOK_URL en Vercel.
 *
 * ── ACTUALIZAR EL SCRIPT ─────────────────────────────────────────────────────
 * 1. Reemplaza el código en Apps Script → Guarda.
 * 2. Implementar → Gestionar implementaciones → lápiz → Nueva versión → Deploy.
 *    (Sin este paso la URL sigue sirviendo la versión vieja.)
 *
 * ── CONFIGURAR VARIABLES DE META (Script Properties) ────────────────────────
 * Para que el envío de ventas a Meta funcione, agrega estas dos propiedades:
 * 1. En Apps Script: Configuración del proyecto (ícono ⚙️) → Propiedades del script
 * 2. Agrega:
 *    - FB_PIXEL_ID    → 27355395054120748
 *    - FB_ACCESS_TOKEN → (el token de Conversions API de Meta)
 *
 * ── CONFIGURAR TRIGGERS (installable) ────────────────────────────────────────
 * Instalar UNA VEZ cada trigger:
 * 1. En Apps Script: menú Activadores (ícono del reloj, barra izquierda)
 * 2. Agregar activador → función: onVentaEdit → Del spreadsheet → Al editar → Guardar
 * 3. Agregar activador → función: onAsignarEdit → Del spreadsheet → Al editar → Guardar
 *
 * ── CONFIGURAR DROPDOWNS DE ASIGNACIÓN ───────────────────────────────────────
 * Al abrir el Sheet aparece el menú "Savaya" en la barra superior.
 * Después de pegar leads existentes o para configurar el Sheet por primera vez:
 * Savaya → Configurar dropdowns de asignación
 */

// ── Vendedoras — editar según el equipo ──────────────────────────────────────
// nombre: lo que aparece en el dropdown. numero: WhatsApp con código de país.
var VENDEDORAS = [
  { nombre: 'Vendedora 1', numero: '584121211526' }
];

// ── Columnas ─────────────────────────────────────────────────────────────────

var HEADERS = [
  'Fecha', 'Nombre', 'Email', 'Ciudad', 'WhatsApp',
  'Origen', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Anuncio',
  'Plataforma', 'Dispositivo',
  'Venta', 'Monto USD', 'Fecha Venta', 'Estado Meta',
  'fbc', 'fbp', 'IP', 'UserAgent',
  'Asignar a', 'Asignado'
];

var COL = {
  FECHA: 1, NOMBRE: 2, EMAIL: 3, CIUDAD: 4, WHATSAPP: 5,
  ORIGEN: 6, UTM_SOURCE: 7, UTM_MEDIUM: 8, UTM_CAMPAIGN: 9, ANUNCIO: 10,
  PLATAFORMA: 11, DISPOSITIVO: 12,
  VENTA: 13, MONTO: 14, FECHA_VENTA: 15, ESTADO_META: 16,
  FBC: 17, FBP: 18, IP: 19, UA: 20,
  ASIGNAR: 21, ASIGNADO: 22
};

// ── Menú personalizado ────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Savaya')
    .addItem('Configurar dropdowns de asignación', 'setupAsignarDropdowns')
    .addToUi();
}

// ── Recepción de leads ────────────────────────────────────────────────────────

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateCampaignSheet(ss, data.campaign);

  ensureHeaders(sheet);

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name      || '',
    data.email     || '',
    data.city      || '',
    data.whatsapp  || '',
    data.source    || '',
    (data.utm && data.utm.utm_source)   || '',
    (data.utm && data.utm.utm_medium)   || '',
    (data.utm && data.utm.utm_campaign) || '',
    (data.utm && data.utm.utm_content)  || '',
    data.platform   || '',
    data.device     || '',
    false,          // Venta — checkbox vacío por defecto
    '',             // Monto USD
    '',             // Fecha Venta
    '',             // Estado Meta
    data.fbc       || '',
    data.fbp       || '',
    data.ip        || '',
    data.userAgent || '',
    '',             // Asignar a
    '',             // Asignado
  ]);

  var lastRow      = sheet.getLastRow();
  var checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  sheet.getRange(lastRow, COL.VENTA).setDataValidation(checkboxRule);

  var vendedoraNames = VENDEDORAS.map(function(v) { return v.nombre; });
  var dropdownRule   = SpreadsheetApp.newDataValidation()
    .requireValueInList(vendedoraNames, true).build();
  sheet.getRange(lastRow, COL.ASIGNAR).setDataValidation(dropdownRule);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Trigger de asignación (installable) ──────────────────────────────────────

function onAsignarEdit(e) {
  var range = e.range;
  var sheet = range.getSheet();
  var col   = range.getColumn();
  var row   = range.getRow();

  if (col !== COL.ASIGNAR || row === 1) return;

  var nombreVendedora = range.getValue();
  if (!nombreVendedora) return;

  // No re-asignar si ya fue asignado
  var asignadoCell = sheet.getRange(row, COL.ASIGNADO);
  if (asignadoCell.getValue() !== '') return;

  var vendedora = VENDEDORAS.filter(function(v) {
    return v.nombre === nombreVendedora;
  })[0];
  if (!vendedora) return;

  var rowData = sheet.getRange(row, 1, 1, COL.WHATSAPP).getValues()[0];
  var nombre  = rowData[COL.NOMBRE - 1];
  var email   = rowData[COL.EMAIL - 1];
  var ciudad  = rowData[COL.CIUDAD - 1];
  var phone   = normalizePhone(String(rowData[COL.WHATSAPP - 1] || ''));

  var waClienteUrl = 'https://wa.me/' + phone;

  var mensaje = 'Hola, te hemos asignado un nuevo cliente potencial '
    + 'desde el equipo de marketing de Savaya 👟\n\n'
    + '📋 Nombre: ' + nombre + '\n'
    + '📍 Ciudad: ' + ciudad + '\n'
    + '📧 Email: ' + email + '\n'
    + '📱 Contáctalo aquí: ' + waClienteUrl + '\n\n'
    + 'Por favor comúnícate a la brevedad 🙏';

  var waUrl = 'https://api.whatsapp.com/send?phone=' + vendedora.numero
    + '&text=' + encodeURIComponent(mensaje);

  // Marcar como asignado antes de mostrar el dialog
  asignadoCell.setValue(nombreVendedora + ' · ' + new Date().toLocaleString('es-VE'));

  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;padding:14px 16px;">'
    + '<p style="margin:0 0 10px;font-size:14px;">Mensaje listo para <b>' + nombreVendedora + '</b>:</p>'
    + '<div style="background:#f4f4f4;border-radius:8px;padding:10px 12px;font-size:12px;'
    + 'line-height:1.6;white-space:pre-wrap;word-break:break-word;color:#333;">'
    + escapeHtml(mensaje)
    + '</div>'
    + '<a href="' + waUrl + '" target="_blank" '
    + 'style="display:block;margin-top:14px;background:#25D366;color:#fff;text-align:center;'
    + 'padding:13px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">'
    + '&#x1F4AC; Abrir WhatsApp'
    + '</a>'
    + '<p style="font-size:11px;color:#999;text-align:center;margin:10px 0 0;">'
    + 'El lead ya quedó marcado como asignado en el Sheet.'
    + '</p>'
    + '</div>'
  ).setWidth(420).setHeight(320);

  SpreadsheetApp.getUi().showModalDialog(html, 'Asignar lead');
}

// ── Trigger de ventas (installable) ──────────────────────────────────────────

function onVentaEdit(e) {
  var range = e.range;
  var sheet = range.getSheet();
  var col   = range.getColumn();
  var row   = range.getRow();

  if (col !== COL.VENTA || row === 1) return;
  if (range.getValue() !== true) return;

  var estadoCell = sheet.getRange(row, COL.ESTADO_META);
  if (estadoCell.getValue() !== '') return;

  var rowData   = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  var name      = rowData[COL.NOMBRE - 1];
  var email     = rowData[COL.EMAIL - 1];
  var city      = rowData[COL.CIUDAD - 1];
  var phone     = rowData[COL.WHATSAPP - 1];
  var monto     = rowData[COL.MONTO - 1];
  var fechaVenta = rowData[COL.FECHA_VENTA - 1];
  var fbc       = rowData[COL.FBC - 1];
  var fbp       = rowData[COL.FBP - 1];
  var ip        = rowData[COL.IP - 1];
  var userAgent = rowData[COL.UA - 1];

  if (!monto || parseFloat(monto) <= 0) {
    estadoCell.setValue('⚠️ Pon el monto, borra esta celda y marca de nuevo');
    return;
  }

  estadoCell.setValue('⏳ Enviando…');

  var eventTime = fechaVenta
    ? Math.floor(new Date(fechaVenta).getTime() / 1000)
    : Math.floor(Date.now() / 1000);

  var result = sendPurchaseToMeta({
    name: name, email: email, city: city, phone: phone,
    monto: monto, eventTime: eventTime, fbc: fbc, fbp: fbp,
    ip: ip, userAgent: userAgent
  });

  estadoCell.setValue(result);
}

// ── Meta Conversions API — Purchase ──────────────────────────────────────────

function sendPurchaseToMeta(data) {
  var props       = PropertiesService.getScriptProperties();
  var pixelId     = props.getProperty('FB_PIXEL_ID');
  var accessToken = props.getProperty('FB_ACCESS_TOKEN');

  if (!pixelId || !accessToken) {
    return '❌ Faltan FB_PIXEL_ID o FB_ACCESS_TOKEN en Script Properties';
  }

  var firstName = String(data.name || '').trim().split(/\s+/)[0];
  var phone     = normalizePhone(String(data.phone || ''));

  var userData = {
    ph:      [sha256(phone)],
    em:      [sha256(data.email)],
    fn:      [sha256(firstName)],
    ct:      [sha256(data.city)],
    country: [sha256('ve')]
  };
  if (data.fbc)       userData.fbc               = data.fbc;
  if (data.fbp)       userData.fbp               = data.fbp;
  if (data.ip)        userData.client_ip_address = data.ip;
  if (data.userAgent) userData.client_user_agent = data.userAgent;

  var event = {
    event_name:       'Purchase',
    event_time:       data.eventTime,
    action_source:    'website',
    event_source_url: 'https://www.savayavzla.com/cp/colegiales',
    user_data:        userData,
    custom_data: {
      value:            parseFloat(data.monto) || 0,
      currency:         'USD',
      content_name:     'Zapato Escolar Mayorista SAVAYA - Temporada Escolar 2026',
      content_category: 'Calzado Escolar al Mayor',
      content_type:     'product'
    }
  };

  var url = 'https://graph.facebook.com/v21.0/' + pixelId + '/events?access_token=' + accessToken;

  try {
    var response = UrlFetchApp.fetch(url, {
      method:             'POST',
      contentType:        'application/json',
      payload:            JSON.stringify({ data: [event] }),
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    if (code === 200) {
      return '✅ ' + new Date().toLocaleString('es-VE');
    } else {
      return '❌ HTTP ' + code + ': ' + response.getContentText().slice(0, 120);
    }
  } catch (err) {
    return '❌ ' + err.message;
  }
}

// ── Configurar dropdowns de asignación (menú Savaya) ─────────────────────────

function setupAsignarDropdowns() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var sheet   = ss.getActiveSheet();
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No hay filas de datos en esta pestaña.');
    return;
  }

  var vendedoraNames = VENDEDORAS.map(function(v) { return v.nombre; });
  var dropdownRule   = SpreadsheetApp.newDataValidation()
    .requireValueInList(vendedoraNames, true).build();

  sheet.getRange(2, COL.ASIGNAR, lastRow - 1, 1).setDataValidation(dropdownRule);

  SpreadsheetApp.getUi().alert(
    'Listo. El dropdown de asignación está configurado en ' + (lastRow - 1) + ' filas.'
  );
}

// ── Utilidades ────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sha256(value) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value).trim().toLowerCase(),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

function normalizePhone(raw) {
  var digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('58')) return digits;
  if (digits.startsWith('0'))  return '58' + digits.slice(1);
  if (digits.length === 10)    return '58' + digits;
  return digits;
}

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
  name = name.replace(/[\[\]\*\?\/\\:]/g, '-').replace(/^'+|'+$/g, '');
  return name.slice(0, 90) || 'sin_campana';
}
