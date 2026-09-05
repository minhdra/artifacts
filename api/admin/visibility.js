const { setVisibility } = require('../_lib/edgeConfig');

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  if (!process.env.ADMIN_TOKEN) {
    return res.status(500).json({ message: 'Server chưa cấu hình ADMIN_TOKEN' });
  }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Sai admin token' });
  }

  const { slug, visibility } = readBody(req);
  if (!slug || !['public', 'private'].includes(visibility)) {
    return res.status(400).json({ message: 'Thiếu slug hoặc visibility không hợp lệ' });
  }

  try {
    const next = await setVisibility(slug, visibility);
    res.status(200).json({ ok: true, map: next });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
