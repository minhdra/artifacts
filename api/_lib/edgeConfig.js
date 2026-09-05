// Lưu trạng thái hiện/ẩn của từng tài liệu trên Vercel Global Config
// (tên mới của Edge Config, cùng 1 sản phẩm - xem
// https://vercel.com/docs/global-config/migration-guide) - đọc cực nhanh,
// không cần server riêng. Nếu chưa gắn store (biến môi trường GLOBAL_CONFIG
// chưa có), rơi về DEFAULTS để trang vẫn chạy được ngay, chỉ là admin chưa
// đổi được gì cho tới khi cấu hình xong (xem hướng dẫn setup).
//
// 'visible' = ai có link cũng xem được. 'hidden' = chỉ admin (có ADMIN_TOKEN)
// mới thấy trong danh sách và mở được. Giá trị cũ 'public'/'private' vẫn được
// hiểu là 'visible'/'hidden' để không phải migrate store.
const DEFAULTS = {
  'module-nhiem-vu': 'visible',
  'tai-khoan-test': 'visible',
  'sso-conshy-ke-hoach': 'hidden',
  'sso-db-thuc-te': 'hidden',
  'sso-tich-hop-app-khac': 'hidden',
};

function normVis(v) {
  return v === 'hidden' || v === 'private' ? 'hidden' : 'visible';
}

function normMap(map) {
  const out = {};
  for (const k of Object.keys(map)) out[k] = normVis(map[k]);
  return out;
}

async function getVisibilityMap() {
  // SDK mới tự đọc GLOBAL_CONFIG, rơi về EDGE_CONFIG nếu có store nối theo
  // kiểu cũ - chỉ cần biết có ít nhất 1 trong 2 biến này tồn tại.
  if (!process.env.GLOBAL_CONFIG && !process.env.EDGE_CONFIG) return normMap(DEFAULTS);
  try {
    // Lazy require - tránh lỗi nếu package chưa cài đặt ở môi trường nào đó.
    const { get } = require('@vercel/global-config');
    const stored = await get('doc_visibility');
    if (stored && typeof stored === 'object') {
      return normMap({ ...DEFAULTS, ...stored });
    }
    return normMap(DEFAULTS);
  } catch (err) {
    console.error('edgeConfig.getVisibilityMap failed:', err.message);
    return normMap(DEFAULTS);
  }
}

async function setVisibility(slug, visibility) {
  const { GLOBAL_CONFIG_ID, VERCEL_API_TOKEN, VERCEL_TEAM_ID } = process.env;
  if (!GLOBAL_CONFIG_ID || !VERCEL_API_TOKEN) {
    throw new Error(
      'Chưa cấu hình GLOBAL_CONFIG_ID / VERCEL_API_TOKEN trên Vercel - xem hướng dẫn setup.',
    );
  }
  const current = await getVisibilityMap();
  const next = { ...current, [slug]: normVis(visibility) };

  const url =
    `https://api.vercel.com/v1/global-config/${GLOBAL_CONFIG_ID}/items` +
    (VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '');

  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{ operation: 'upsert', key: 'doc_visibility', value: next }],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Ghi Global Config thất bại: ${resp.status} ${text}`);
  }
  return next;
}

module.exports = { getVisibilityMap, setVisibility, normVis, DEFAULTS };
