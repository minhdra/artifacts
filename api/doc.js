const fs = require('fs');
const path = require('path');
const { getVisibilityMap } = require('./_lib/edgeConfig');
const { isAdmin } = require('./_lib/auth');

module.exports = async (req, res) => {
  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  const slug = String(rawSlug || '').replace(/[^a-z0-9-]/gi, '');
  if (!slug) return res.status(400).json({ message: 'Thiếu slug' });

  const filePath = path.join(__dirname, '_content', `${slug}.html`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
  }

  const map = await getVisibilityMap();
  const visibility = map[slug] || 'visible';

  // Tài liệu ẩn: chỉ admin mới mở được. Trả 404 (không phải 401) để không lộ
  // sự tồn tại của tài liệu với người ngoài.
  if (visibility === 'hidden' && !isAdmin(req)) {
    return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
  }

  const html = fs.readFileSync(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
