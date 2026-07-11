const crypto = require('crypto');

// Meta exige: trim + lowercase antes de hashear
function sha256(value) {
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

function normalizePhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('58')) return digits;
  if (digits.startsWith('0')) return '58' + digits.slice(1);
  if (digits.length === 10) return '58' + digits;
  return digits;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const {
    name, email, city, whatsapp,
    eventId, fbp, fbc, eventSourceUrl,
    campaign, utm, testEventCode,
  } = req.body || {};

  if (!name || !email || !city || !whatsapp) {
    res.status(400).json({ error: 'Faltan campos requeridos' });
    return;
  }

  const phone = normalizePhone(whatsapp);
  const PIXEL_ID = process.env.FB_PIXEL_ID;
  const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
  const eventTime = Math.floor(Date.now() / 1000);

  const tasks = [];

  if (PIXEL_ID && ACCESS_TOKEN) {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress;

    const firstName = name.trim().split(/\s+/)[0];

    // user_data completo → mejor match rate en Meta
    const userData = {
      em:      [sha256(email)],
      ph:      [sha256(phone)],
      fn:      [sha256(firstName)],
      ct:      [sha256(city)],
      country: [sha256('ve')],
      client_ip_address: clientIp,
      client_user_agent: req.headers['user-agent'],
    };
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;

    // content_name debe coincidir exactamente con el del browser para deduplicar Lead
    const CONTENT_NAME = 'Savaya Catálogo Mayorista Escolar - Formulario';

    const customData = {
      content_name: CONTENT_NAME,
      city,
      campaign: campaign || 'sin_campana',
      ...(utm || {}),
    };

    // Lead — deduplica con el browser via eventId
    const leadEvent = {
      event_name:       'Lead',
      event_time:       eventTime,
      event_id:         eventId,
      event_source_url: eventSourceUrl,
      action_source:    'website',
      user_data:        userData,
      custom_data:      customData,
    };

    // Contact — deduplica con el browser via `${eventId}_c`
    const contactEvent = {
      event_name:       'Contact',
      event_time:       eventTime,
      event_id:         `${eventId}_c`,
      event_source_url: eventSourceUrl,
      action_source:    'website',
      user_data:        userData,
      custom_data:      customData,
    };

    const fbBody = { data: [leadEvent, contactEvent] };
    if (testEventCode) fbBody.test_event_code = testEventCode;

    tasks.push(
      fetch(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbBody),
      })
        .then(async (fbRes) => {
          if (!fbRes.ok) console.error('Facebook CAPI error:', await fbRes.text());
        })
        .catch((err) => console.error('Error llamando a Facebook CAPI:', err))
    );
  } else {
    console.warn('FB_PIXEL_ID o FB_ACCESS_TOKEN no configurados — se omite Conversions API.');
  }

  if (process.env.LEAD_WEBHOOK_URL) {
    tasks.push(
      fetch(process.env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          name,
          email,
          city,
          whatsapp: phone,
          campaign: campaign || 'sin_campana',
          source:   campaign || 'sin_campana',
          utm,
        }),
      }).catch((err) => console.error('Error enviando a LEAD_WEBHOOK_URL:', err))
    );
  }

  await Promise.allSettled(tasks);

  res.status(200).json({ ok: true });
};
