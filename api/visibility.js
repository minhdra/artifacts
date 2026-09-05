const { getVisibilityMap } = require('./_lib/edgeConfig');

module.exports = async (req, res) => {
  const map = await getVisibilityMap();
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(map);
};
