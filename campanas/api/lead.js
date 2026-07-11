const crypto = require('crypto');

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
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

  const { name, email, city, whatsapp, eventId, fbp, fbc, eventSourceUrl, campaign, utm, testEventCode } = req.body || {};

  if (!name || !email || !city || !whatsapp) {
    res.status(400).json({ error: 'Faltan campos requeridos' });
    return;
  }

  const phone = normalizePhone(whatsapp);
  const PIXEL_ID = process.env.FB_PIXEL_ID;
  const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

  const tasks = [];

  if (PIXEL_ID && ACCESS_TOKEN) {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress;

    const eventPayload = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: eventSourceUrl,
      action_source: 'website',
      user_data: {
        em: [sha256(email.trim().toLowerCase())],
        ph: [sha256(phone)],
        client_ip_address: clientIp,
        client_user_agent: req.headers['user-agent'],
      },
      custom_data: {
        content_name: 'Savaya Landing - Formulario de contacto',
        city,
        campaign: campaign || 'sin_campana',
        ...(utm || {}),
      },
    };
    if (fbp) eventPayload.user_data.fbp = fbp;
    if (fbc) eventPayload.user_data.fbc = fbc;

    const fbBody = { data: [eventPayload] };
    if (testEventCode) fbBody.test_event_code = testEventCode;

    tasks.push(
      fetch(`https://graph.facebook.com/v20.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
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
    console.warn('FB_PIXEL_ID / FB_ACCESS_TOKEN no configurados: se omite el envío a Conversions API.');
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
          source: campaign || 'sin_campana',
          utm,
        }),
      }).catch((err) => console.error('Error enviando a LEAD_WEBHOOK_URL:', err))
    );
  }

  await Promise.allSettled(tasks);

  res.status(200).json({ ok: true });
};
