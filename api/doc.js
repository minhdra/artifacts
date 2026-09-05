const fs = require('fs');
const path = require('path');
const { getVisibilityMap } = require('./_lib/edgeConfig');
const { verify, parseCookies } = require('./_lib/cookies');

module.exports = async (req, res) => {
  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  const slug = String(rawSlug || '').replace(/[^a-z0-9-]/gi, '');
  if (!slug) return res.status(400).json({ message: 'Thiếu slug' });

  const filePath = path.join(__dirname, '_content', `${slug}.html`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
  }

  const map = await getVisibilityMap();
  const visibility = map[slug] || 'private';

  if (visibility === 'private') {
    const secret = process.env.COOKIE_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server chưa cấu hình COOKIE_SECRET' });
    }
    const cookies = parseCookies(req.headers.cookie);
    const payload = verify(cookies.doc_session, secret);
    if (!payload) {
      return res.status(401).json({ locked: true });
    }
  }

  const html = fs.readFileSync(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
