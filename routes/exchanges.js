const Exchange = require('../models/exchange');

module.exports.fetchAll = async (req, res, next) => {
  const exchanges = await Exchange.query().eager('markets.[pair, exchange]');
  return res.status(200).json(exchanges);
};