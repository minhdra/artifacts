const { getVisibilityMap } = require('./_lib/edgeConfig');
const { isAdmin } = require('./_lib/auth');

module.exports = async (req, res) => {
  const map = await getVisibilityMap();
  const admin = isAdmin(req);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ map, isAdmin: admin });
};
