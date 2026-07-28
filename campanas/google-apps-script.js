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
  { nombre: 'Rosmary', numero: '584121211526' },
  { nombre: 'Cecilia', numero: '584242908090' }
];

// ── Columnas ─────────────────────────────────────────────────────────────────

var HEADERS = [
  'Fecha', 'Nombre', 'Email', 'Ciudad', 'WhatsApp',
  'Origen', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Anuncio',
  'Plataforma', 'Dispositivo',
  'Venta', 'Monto USD', 'Fecha Venta', 'Estado Meta',
  'fbc', 'fbp', 'IP', 'UserAgent',
  'Asignar a', 'Asignado',
  'Negocio', 'Cal. Auto', 'Cal. Vendedor'
];

var COL = {
  FECHA: 1, NOMBRE: 2, EMAIL: 3, CIUDAD: 4, WHATSAPP: 5,
  ORIGEN: 6, UTM_SOURCE: 7, UTM_MEDIUM: 8, UTM_CAMPAIGN: 9, ANUNCIO: 10,
  PLATAFORMA: 11, DISPOSITIVO: 12,
  VENTA: 13, MONTO: 14, FECHA_VENTA: 15, ESTADO_META: 16,
  FBC: 17, FBP: 18, IP: 19, UA: 20,
  ASIGNAR: 21, ASIGNADO: 22,
  NEGOCIO: 23, CAL_AUTO: 24, CAL_VENDEDOR: 25
};

// ── Calificación de leads ─────────────────────────────────────────────────────

var CIUDADES_PRINCIPALES = [
  'Valencia', 'Caracas', 'Maracaibo', 'Ciudad Bolívar', 'Barquisimeto', 'Mérida',
  'Maracay', 'San Cristóbal', 'Miranda', 'Maturín', 'Barcelona',
  'Puerto La Cruz', 'Ciudad Guayana'
];

function calcCalificacion(negocio, rawCity) {
  var ciudad      = normalizeCity(rawCity || '');
  var esPrincipal = CIUDADES_PRINCIPALES.indexOf(ciudad) !== -1;
  var tieneNegocio = String(negocio || '').toLowerCase() === 'si';
  if (tieneNegocio && esPrincipal) return '🔥 Caliente';
  if (tieneNegocio || esPrincipal) return '🌡️ Tibio';
  return '❄️ Frío';
}

// ── Menú personalizado ────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Savaya')
    .addItem('Configurar dropdowns de asignación', 'setupAsignarDropdowns')
    .addSeparator()
    .addItem('📊 Actualizar métricas', 'buildMetrics')
    .addItem('⏰ Instalar actualización automática (8am diario)', 'installMetricsTrigger')
    .addToUi();
}

// ── Recepción de leads ────────────────────────────────────────────────────────

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateCampaignSheet(ss, data.campaign);

  ensureHeaders(sheet);

  var cal = calcCalificacion(data.negocio, data.city);

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
    data.negocio === 'si' ? 'Sí' : data.negocio === 'no' ? 'No' : '',  // Negocio
    cal,            // Cal. Auto
    '',             // Cal. Vendedor
  ]);

  var lastRow      = sheet.getLastRow();
  var checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  sheet.getRange(lastRow, COL.VENTA).setDataValidation(checkboxRule);

  var vendedoraNames = VENDEDORAS.map(function(v) { return v.nombre; });
  var dropdownRule   = SpreadsheetApp.newDataValidation()
    .requireValueInList(vendedoraNames, true).build();
  sheet.getRange(lastRow, COL.ASIGNAR).setDataValidation(dropdownRule);

  var calColor = cal === '🔥 Caliente' ? '#d4edda' : cal === '🌡️ Tibio' ? '#fff3cd' : '#d1ecf1';
  sheet.getRange(lastRow, COL.CAL_AUTO).setBackground(calColor).setFontWeight('bold');

  var calDropdown = SpreadsheetApp.newDataValidation()
    .requireValueInList(['🔥 Caliente', '🌡️ Tibio', '❄️ Frío'], true).build();
  sheet.getRange(lastRow, COL.CAL_VENDEDOR).setDataValidation(calDropdown);

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

  var calDropdown = SpreadsheetApp.newDataValidation()
    .requireValueInList(['🔥 Caliente', '🌡️ Tibio', '❄️ Frío'], true).build();
  sheet.getRange(2, COL.CAL_VENDEDOR, lastRow - 1, 1).setDataValidation(calDropdown);

  SpreadsheetApp.getUi().alert(
    'Listo. Dropdowns de asignación y calificación configurados en ' + (lastRow - 1) + ' filas.'
  );
}

// ── Métricas ──────────────────────────────────────────────────────────────────

var METRICS_SHEET   = '📊 Métricas';
var COLOR_GOLD      = '#CA8C31';
var COLOR_GOLD_LT   = '#F5E6C8';
var COLOR_HIGHLIGHT = '#FFFDE7';

// ── Mapa de ciudades venezolanas: texto normalizado → nombre canónico ─────────
// Clave: sin tildes, minúsculas. Cubre nombre de estado Y ciudad principal.
var CITY_MAP = {
  // Carabobo / Valencia
  'carabobo': 'Valencia',       'valencia': 'Valencia',
  'naguanagua': 'Valencia',     'san diego': 'Valencia',
  // Caracas / Distrito Capital
  'caracas': 'Caracas',         'distrito capital': 'Caracas',
  'dtto capital': 'Caracas',    'dtto. capital': 'Caracas',
  'distrito federal': 'Caracas',
  // Miranda (Gran Caracas)
  'miranda': 'Miranda',         'los teques': 'Miranda',
  'guarenas': 'Miranda',        'guatire': 'Miranda',
  'charallave': 'Miranda',
  // Aragua / Maracay
  'aragua': 'Maracay',          'maracay': 'Maracay',
  'turmero': 'Maracay',         'cagua': 'Maracay',
  // Lara / Barquisimeto
  'lara': 'Barquisimeto',       'barquisimeto': 'Barquisimeto',
  'cabudare': 'Barquisimeto',
  // Zulia / Maracaibo
  'zulia': 'Maracaibo',         'maracaibo': 'Maracaibo',
  // Táchira / San Cristóbal
  'tachira': 'San Cristóbal',   'san cristobal': 'San Cristóbal',
  // Mérida
  'merida': 'Mérida',
  // Bolívar / Ciudad Bolívar y Ciudad Guayana
  'bolivar': 'Ciudad Bolívar',  'ciudad bolivar': 'Ciudad Bolívar',
  'ciudad guayana': 'Ciudad Guayana',
  'puerto ordaz': 'Ciudad Guayana', 'san felix': 'Ciudad Guayana',
  // Anzoátegui / Barcelona
  'anzoategui': 'Barcelona',    'barcelona': 'Barcelona',
  'puerto la cruz': 'Puerto La Cruz',
  // Monagas / Maturín
  'monagas': 'Maturín',         'maturin': 'Maturín',
  // Sucre / Cumaná
  'sucre': 'Cumaná',            'cumana': 'Cumaná',
  // Nueva Esparta / Margarita
  'nueva esparta': 'Isla de Margarita', 'margarita': 'Isla de Margarita',
  'porlamar': 'Isla de Margarita',
  // La Guaira / Vargas
  'vargas': 'La Guaira',        'la guaira': 'La Guaira',
  'maiquetia': 'La Guaira',
  // Portuguesa / Guanare
  'portuguesa': 'Guanare',      'guanare': 'Guanare',
  // Yaracuy / San Felipe
  'yaracuy': 'San Felipe',      'san felipe': 'San Felipe',
  // Cojedes / San Carlos
  'cojedes': 'San Carlos',      'san carlos': 'San Carlos',
  // Resto
  'barinas': 'Barinas',
  'trujillo': 'Trujillo',
  'falcon': 'Coro',             'coro': 'Coro',
  'apure': 'San Fernando de Apure',
  'guarico': 'San Juan de los Morros',
  'delta amacuro': 'Tucupita',  'tucupita': 'Tucupita',
  'amazonas': 'Puerto Ayacucho','puerto ayacucho': 'Puerto Ayacucho',
};

function normalizeCity(raw) {
  if (!raw) return 'Sin datos';
  var original = String(raw).trim();
  if (!original) return 'Sin datos';

  var n = original.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Coincidencia exacta
  if (CITY_MAP[n]) return CITY_MAP[n];

  // Coincidencia parcial: busca el key más largo que aparezca como palabra completa
  var bestKey = null, bestLen = 0;
  var mapKeys = Object.keys(CITY_MAP);
  for (var i = 0; i < mapKeys.length; i++) {
    var key = mapKeys[i];
    var idx = n.indexOf(key);
    if (idx === -1) continue;
    var before = idx === 0            ? ' ' : n[idx - 1];
    var after  = idx + key.length >= n.length ? ' ' : n[idx + key.length];
    if (before === ' ' && after === ' ' && key.length > bestLen) {
      bestKey = key;
      bestLen = key.length;
    }
  }
  if (bestKey) return CITY_MAP[bestKey];

  // Fallback: título original
  return original.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

function buildMetrics() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = Session.getScriptTimeZone();

  var mSheet = ss.getSheetByName(METRICS_SHEET);
  if (!mSheet) {
    mSheet = ss.insertSheet(METRICS_SHEET, 0);
  } else {
    mSheet.clearContents();
    mSheet.clearFormats();
    try { mSheet.clearConditionalFormatRules(); } catch (e) {}
    var existingCharts = mSheet.getCharts();
    for (var ec = 0; ec < existingCharts.length; ec++) mSheet.removeChart(existingCharts[ec]);
  }

  // ── Recolectar todas las filas de cada pestaña de campaña ────────────
  var allLeads = [];
  var sheets   = ss.getSheets();

  for (var i = 0; i < sheets.length; i++) {
    var s = sheets[i];
    if (s.getName() === METRICS_SHEET) continue;
    var lastRow = s.getLastRow();
    if (lastRow < 2) continue;
    var numCols = Math.min(s.getLastColumn(), HEADERS.length);
    var data    = s.getRange(2, 1, lastRow - 1, numCols).getValues();

    for (var j = 0; j < data.length; j++) {
      var r = data[j];
      while (r.length < HEADERS.length) r.push('');
      var rawFecha = r[COL.FECHA - 1];
      var d = rawFecha ? new Date(rawFecha) : null;
      if (d && isNaN(d.getTime())) d = null;

      allLeads.push({
        date:        d,
        ciudad:      normalizeCity(r[COL.CIUDAD - 1]),          // ← normalización
        plataforma:  strOr(r[COL.PLATAFORMA - 1],  'Sin datos'),
        dispositivo: strOr(r[COL.DISPOSITIVO - 1], 'Sin datos'),
        utmCampaign: strOr(r[COL.UTM_CAMPAIGN - 1],'Sin UTM'),
        anuncio:     strOr(r[COL.ANUNCIO - 1],     'Sin datos'),
        venta:       r[COL.VENTA - 1] === true,
        monto:       parseFloat(r[COL.MONTO - 1]) || 0,
        asignarA:    strOr(r[COL.ASIGNAR - 1],     ''),
        calAuto:     strOr(r[COL.CAL_AUTO - 1],    'Sin calificar'),
        tab:         s.getName()
      });
    }
  }

  // ── Agregación ────────────────────────────────────────────────────────
  var DIA_NAMES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  var totalLeads  = allLeads.length;
  var totalVentas = 0, totalMonto = 0;

  var byTab = {}, byMetaCamp = {}, byAnuncio = {};
  var byCiudad = {}, byPlataforma = {}, byDispositivo = {};
  var byDia = {}, byFecha = {}, byVendedora = {}, byCalAuto = {};

  for (var d2 = 0; d2 < DIA_NAMES.length; d2++) byDia[DIA_NAMES[d2]] = { leads: 0, ventas: 0 };

  function bucket(obj, key) {
    if (!obj[key]) obj[key] = { leads: 0, ventas: 0, monto: 0 };
  }

  for (var k = 0; k < allLeads.length; k++) {
    var l = allLeads[k];
    var v = l.venta;
    if (v) { totalVentas++; totalMonto += l.monto; }

    bucket(byTab, l.tab);         bucket(byMetaCamp, l.utmCampaign);
    bucket(byAnuncio, l.anuncio); bucket(byCiudad, l.ciudad);
    bucket(byPlataforma, l.plataforma); bucket(byDispositivo, l.dispositivo);
    bucket(byCalAuto, l.calAuto);

    byTab[l.tab].leads++;               if (v) { byTab[l.tab].ventas++;               byTab[l.tab].monto         += l.monto; }
    byMetaCamp[l.utmCampaign].leads++;  if (v) { byMetaCamp[l.utmCampaign].ventas++;  byMetaCamp[l.utmCampaign].monto += l.monto; }
    byAnuncio[l.anuncio].leads++;       if (v) { byAnuncio[l.anuncio].ventas++;       byAnuncio[l.anuncio].monto += l.monto; }
    byCiudad[l.ciudad].leads++;         if (v) { byCiudad[l.ciudad].ventas++;         byCiudad[l.ciudad].monto   += l.monto; }
    byPlataforma[l.plataforma].leads++; if (v) { byPlataforma[l.plataforma].ventas++; byPlataforma[l.plataforma].monto += l.monto; }
    byDispositivo[l.dispositivo].leads++;if (v) { byDispositivo[l.dispositivo].ventas++;byDispositivo[l.dispositivo].monto += l.monto; }
    byCalAuto[l.calAuto].leads++;       if (v) { byCalAuto[l.calAuto].ventas++;       byCalAuto[l.calAuto].monto += l.monto; }

    if (l.date) {
      var dName = DIA_NAMES[l.date.getDay()];
      byDia[dName].leads++;
      if (v) byDia[dName].ventas++;

      var fKey = Utilities.formatDate(l.date, tz, 'yyyy-MM-dd');
      if (!byFecha[fKey]) byFecha[fKey] = { leads: 0, ventas: 0 };
      byFecha[fKey].leads++;
      if (v) byFecha[fKey].ventas++;
    }

    if (l.asignarA) {
      if (!byVendedora[l.asignarA]) byVendedora[l.asignarA] = { asignados: 0, ventas: 0, monto: 0 };
      byVendedora[l.asignarA].asignados++;
      if (v) { byVendedora[l.asignarA].ventas++; byVendedora[l.asignarA].monto += l.monto; }
    }
  }

  // ── Helpers de escritura ──────────────────────────────────────────────
  var ROW   = 1;
  var NCOLS = 6;
  var rng   = {}; // { key: { hdr, end } } — rangos para las gráficas

  function nextRow(values, bgColor) {
    for (var c = 0; c < values.length; c++) {
      var cell = mSheet.getRange(ROW, c + 1);
      cell.setValue(values[c]);
      if (bgColor) cell.setBackground(bgColor);
    }
    ROW++;
  }

  function writeTitle(text) {
    mSheet.getRange(ROW, 1, 1, NCOLS).merge()
      .setValue(text)
      .setFontWeight('bold').setFontSize(11)
      .setBackground(COLOR_GOLD).setFontColor('#FFFFFF')
      .setHorizontalAlignment('left');
    ROW++;
  }

  // Devuelve el número de la fila recién escrita (para range tracking)
  function writeColHeaders(cols) {
    var hdrRow = ROW;
    for (var c = 0; c < cols.length; c++) {
      mSheet.getRange(ROW, c + 1).setValue(cols[c])
        .setFontWeight('bold').setBackground(COLOR_GOLD_LT);
    }
    ROW++;
    return hdrRow;
  }

  function spacer() { ROW++; }

  function pct(part, total) { return total ? Math.round(part / total * 100) + '%' : '—'; }
  function fmtMonto(m)       { return m > 0 ? '$' + m.toFixed(2) : '—'; }

  function sortByLeads(obj) {
    return Object.keys(obj).sort(function(a, b) { return obj[b].leads - obj[a].leads; });
  }
  function sortByVentas(obj) {
    return Object.keys(obj).sort(function(a, b) { return obj[b].ventas - obj[a].ventas; });
  }

  // ── Encabezado ─────────────────────────────────────────────────────────
  mSheet.getRange(ROW, 1, 1, NCOLS).merge()
    .setValue('📊 MÉTRICAS SAVAYA')
    .setFontWeight('bold').setFontSize(16)
    .setBackground('#1A1A1A').setFontColor(COLOR_GOLD);
  ROW++;
  mSheet.getRange(ROW, 1, 1, NCOLS).merge()
    .setValue('Actualizado: ' + new Date().toLocaleString('es-VE'))
    .setFontColor('#888888').setFontSize(9).setBackground('#F9F9F9');
  ROW++;
  spacer();

  // ── RESUMEN GENERAL ─────────────────────────────────────────────────
  writeTitle('RESUMEN GENERAL');
  writeColHeaders(['Leads totales','Ventas cerradas','Conversión','Monto total USD','Ticket promedio','']);
  nextRow([
    totalLeads, totalVentas, pct(totalVentas, totalLeads),
    fmtMonto(totalMonto), totalVentas ? '$' + (totalMonto / totalVentas).toFixed(2) : '—', ''
  ], COLOR_HIGHLIGHT);
  spacer();

  // ── POR CALIFICACIÓN AUTO ────────────────────────────────────────────
  writeTitle('POR CALIFICACIÓN AUTO');
  writeColHeaders(['Calificación','Leads','Ventas','Conversión','Monto USD','']);
  var calOrder = ['🔥 Caliente', '🌡️ Tibio', '❄️ Frío', 'Sin calificar'];
  for (var qi = 0; qi < calOrder.length; qi++) {
    var qk = calOrder[qi];
    if (!byCalAuto[qk]) continue;
    var qv = byCalAuto[qk];
    var qColor = qk === '🔥 Caliente' ? '#d4edda' : qk === '🌡️ Tibio' ? '#fff3cd' : qk === '❄️ Frío' ? '#d1ecf1' : '';
    nextRow([qk, qv.leads, qv.ventas, pct(qv.ventas, qv.leads), fmtMonto(qv.monto), ''], qColor);
  }
  spacer();

  // ── POR VENDEDORA ────────────────────────────────────────────────────
  writeTitle('POR VENDEDORA');
  var hdr = writeColHeaders(['Vendedora','Leads asignados','Ventas cerradas','Conversión','Monto USD','']);
  var vendKeys = sortByVentas(byVendedora);
  if (vendKeys.length === 0) {
    nextRow(['(Ningún lead asignado aún)', '', '', '', '', '']);
  } else {
    rng.vendedora = { hdr: hdr };
    for (var vi = 0; vi < vendKeys.length; vi++) {
      var vv = byVendedora[vendKeys[vi]];
      nextRow([vendKeys[vi], vv.asignados, vv.ventas, pct(vv.ventas, vv.asignados), fmtMonto(vv.monto), ''],
              vi % 2 === 0 ? '' : '#FAFAFA');
    }
    rng.vendedora.end = ROW - 1;
  }
  spacer();

  // ── POR CIUDAD ───────────────────────────────────────────────────────
  writeTitle('POR CIUDAD');
  hdr = writeColHeaders(['Ciudad','Leads','Ventas','Conversión','Monto USD','']);
  var ciudadKeys = sortByLeads(byCiudad);
  rng.ciudad = { hdr: hdr };
  for (var ci = 0; ci < ciudadKeys.length; ci++) {
    var cv = byCiudad[ciudadKeys[ci]];
    nextRow([ciudadKeys[ci], cv.leads, cv.ventas, pct(cv.ventas, cv.leads), fmtMonto(cv.monto), ''],
            ci % 2 === 0 ? '' : '#FAFAFA');
  }
  rng.ciudad.end = ROW - 1;
  spacer();

  // ── POR PLATAFORMA ───────────────────────────────────────────────────
  writeTitle('POR PLATAFORMA');
  hdr = writeColHeaders(['Plataforma','Leads','Ventas','Conversión','Monto USD','']);
  var platKeys = sortByLeads(byPlataforma);
  rng.plataforma = { hdr: hdr };
  for (var pi = 0; pi < platKeys.length; pi++) {
    var pv = byPlataforma[platKeys[pi]];
    nextRow([platKeys[pi], pv.leads, pv.ventas, pct(pv.ventas, pv.leads), fmtMonto(pv.monto), ''],
            pi % 2 === 0 ? '' : '#FAFAFA');
  }
  rng.plataforma.end = ROW - 1;
  spacer();

  // ── POR DISPOSITIVO ──────────────────────────────────────────────────
  writeTitle('POR DISPOSITIVO');
  hdr = writeColHeaders(['Dispositivo','Leads','Ventas','Conversión','Monto USD','']);
  var dispKeys = sortByLeads(byDispositivo);
  rng.dispositivo = { hdr: hdr };
  for (var di = 0; di < dispKeys.length; di++) {
    var dv = byDispositivo[dispKeys[di]];
    nextRow([dispKeys[di], dv.leads, dv.ventas, pct(dv.ventas, dv.leads), fmtMonto(dv.monto), ''],
            di % 2 === 0 ? '' : '#FAFAFA');
  }
  rng.dispositivo.end = ROW - 1;
  spacer();

  // ── POR DÍA DE LA SEMANA ─────────────────────────────────────────────
  writeTitle('LEADS POR DÍA DE LA SEMANA');
  hdr = writeColHeaders(['Día','Leads','Ventas','% del total','','']);
  var diaOrder = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  rng.dia = { hdr: hdr };
  for (var oi = 0; oi < diaOrder.length; oi++) {
    var dd = byDia[diaOrder[oi]];
    nextRow([diaOrder[oi], dd.leads, dd.ventas, pct(dd.leads, totalLeads), '', ''],
            oi % 2 === 0 ? '' : '#FAFAFA');
  }
  rng.dia.end = ROW - 1;
  spacer();

  // ── POR CAMPAÑA META ────────────────────────────────────────────────
  writeTitle('POR CAMPAÑA META (utm_campaign)');
  hdr = writeColHeaders(['Campaña','Leads','Ventas','Conversión','Monto USD','']);
  var metaKeys = sortByLeads(byMetaCamp);
  rng.metaCamp = { hdr: hdr };
  for (var mi = 0; mi < metaKeys.length; mi++) {
    var mv = byMetaCamp[metaKeys[mi]];
    nextRow([metaKeys[mi], mv.leads, mv.ventas, pct(mv.ventas, mv.leads), fmtMonto(mv.monto), ''],
            mi % 2 === 0 ? '' : '#FAFAFA');
  }
  rng.metaCamp.end = ROW - 1;
  spacer();

  // ── POR ANUNCIO ──────────────────────────────────────────────────────
  writeTitle('POR ANUNCIO (utm_content)');
  hdr = writeColHeaders(['Anuncio','Leads','Ventas','Conversión','Monto USD','']);
  var anuncioKeys = sortByLeads(byAnuncio);
  rng.anuncio = { hdr: hdr };
  for (var ai = 0; ai < anuncioKeys.length; ai++) {
    var av = byAnuncio[anuncioKeys[ai]];
    nextRow([anuncioKeys[ai], av.leads, av.ventas, pct(av.ventas, av.leads), fmtMonto(av.monto), ''],
            ai % 2 === 0 ? '' : '#FAFAFA');
  }
  rng.anuncio.end = ROW - 1;
  spacer();

  // ── POR LANDING ──────────────────────────────────────────────────────
  writeTitle('POR LANDING (pestaña)');
  hdr = writeColHeaders(['Landing','Leads','Ventas','Conversión','Monto USD','']);
  var tabKeys = sortByLeads(byTab);
  rng.tab = { hdr: hdr };
  for (var ti = 0; ti < tabKeys.length; ti++) {
    var tv = byTab[tabKeys[ti]];
    nextRow([tabKeys[ti], tv.leads, tv.ventas, pct(tv.ventas, tv.leads), fmtMonto(tv.monto), ''],
            ti % 2 === 0 ? '' : '#FAFAFA');
  }
  rng.tab.end = ROW - 1;
  spacer();

  // ── TENDENCIA POR FECHA ──────────────────────────────────────────────
  writeTitle('TENDENCIA POR FECHA');
  hdr = writeColHeaders(['Fecha','Leads','Ventas','','','']);
  var fechaKeys = Object.keys(byFecha).sort();
  rng.fecha = { hdr: hdr };
  for (var fi = 0; fi < fechaKeys.length; fi++) {
    var fv = byFecha[fechaKeys[fi]];
    nextRow([fechaKeys[fi], fv.leads, fv.ventas, '', '', ''],
            fi % 2 === 0 ? '' : '#FAFAFA');
  }
  rng.fecha.end = ROW - 1;

  // ── Formato ──────────────────────────────────────────────────────────
  mSheet.setColumnWidth(1, 240);
  mSheet.autoResizeColumns(2, NCOLS - 1);
  mSheet.setFrozenRows(0);

  // ── Gráficas ─────────────────────────────────────────────────────────
  buildCharts(mSheet, rng, totalLeads);

  ss.setActiveSheet(mSheet);
  SpreadsheetApp.getUi().alert(
    '✅ Métricas actualizadas\n\n'
    + totalLeads + ' leads · ' + totalVentas + ' ventas · $' + totalMonto.toFixed(2) + ' USD'
  );
}

// ── Gráficas ──────────────────────────────────────────────────────────────────

function buildCharts(sheet, rng, totalLeads) {
  if (totalLeads === 0) return;

  var C = Charts.ChartType;

  // [key, tipo, título, numCols, anchorCol, offsetY, ancho, alto]
  // Columna izquierda (col 9): tendencia + ciudad + día de semana
  // Columna derecha  (col 16): plataforma + dispositivo + vendedora
  var defs = [
    ['fecha',      C.LINE,   'Tendencia de leads',        3,  9,   0, 560, 290],
    ['ciudad',     C.BAR,    'Leads por ciudad',           2,  9, 300, 560, 330],
    ['dia',        C.COLUMN, 'Leads por día de semana',    2,  9, 640, 560, 280],
    ['plataforma', C.PIE,    'Leads por plataforma',       2, 16,   0, 440, 280],
    ['dispositivo',C.PIE,    'Leads por dispositivo',      2, 16, 290, 440, 260],
    ['vendedora',  C.BAR,    'Ventas por vendedora',       3, 16, 560, 440, 300],
  ];

  for (var i = 0; i < defs.length; i++) {
    var d   = defs[i];
    var key = d[0], type = d[1], title = d[2], cols = d[3];
    var anchorCol = d[4], oy = d[5], w = d[6], h = d[7];

    var r = rng[key];
    if (!r || !r.end || r.end <= r.hdr) continue; // sin datos

    var numRows = r.end - r.hdr + 1; // incluye la fila de encabezados de columna
    var range   = sheet.getRange(r.hdr, 1, numRows, cols);

    try {
      var chart = sheet.newChart()
        .setChartType(type)
        .addRange(range)
        .setOption('title', title)
        .setOption('titleTextStyle', { fontSize: 11, bold: true, color: '#1A1A1A' })
        .setOption('backgroundColor', { fill: '#FAFAFA' })
        .setOption('width', w)
        .setOption('height', h)
        .setPosition(1, anchorCol, 0, oy)
        .build();
      sheet.insertChart(chart);
    } catch (e) {
      // Ignorar gráfica si falla (datos insuficientes para ese tipo)
    }
  }
}

function installMetricsTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'buildMetrics') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('buildMetrics')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
  SpreadsheetApp.getUi().alert(
    '✅ Listo. Las métricas se actualizarán automáticamente todos los días a las 8am.'
  );
}

// ── Utilidades de métricas ─────────────────────────────────────────────────

function strOr(val, fallback) {
  var s = String(val || '').trim();
  return s || fallback;
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
