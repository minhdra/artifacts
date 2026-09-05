// Xác thực admin bằng token tĩnh (biến môi trường ADMIN_TOKEN trên Vercel).
// Client gửi kèm header `Authorization: Bearer <token>`; token này được lưu ở
// localStorage phía trình duyệt nên chỉ máy đã đăng nhập admin mới có.
function getBearer(req) {
  return (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

function isAdmin(req) {
  const token = getBearer(req);
  return !!token && !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

module.exports = { getBearer, isAdmin };
