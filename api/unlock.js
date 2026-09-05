const crypto = require('crypto');
const { sign } = require('./_lib/cookies');

// Mặc định = sha256("011100") - đổi mật khẩu sau này bằng cách set biến môi
// trường DOC_PASSWORD_HASH trên Vercel, không cần sửa code/redeploy.
const DEFAULT_HASH = '73d6a4f41269146becc132a7b3622abe2413c3754fce7111a54f69bc63f69709';
const SESSION_MS = 12 * 60 * 60 * 1000; // 12 giờ

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

  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    return res.status(500).json({ message: 'Server chưa cấu hình COOKIE_SECRET' });
  }

  const { passcode } = readBody(req);
  const hash = crypto.createHash('sha256').update(String(passcode || '')).digest('hex');
  const expected = process.env.DOC_PASSWORD_HASH || DEFAULT_HASH;

  if (hash !== expected) {
    return res.status(401).json({ ok: false, message: 'Sai mật khẩu' });
  }

  const token = sign({ exp: Date.now() + SESSION_MS }, secret);
  const isProd = process.env.VERCEL_ENV !== 'development';
  res.setHeader(
    'Set-Cookie',
    `doc_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MS / 1000}; SameSite=Lax${isProd ? '; Secure' : ''}`,
  );
  res.status(200).json({ ok: true });
};
