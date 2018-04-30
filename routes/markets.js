const Market = require('../models/market');

module.exports.fetchAll = async (req, res) => {
  const markets = await Market.query();
  return res.status(200).json(markets);
}