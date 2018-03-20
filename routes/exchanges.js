const Exchange = require('../models/exchange');

module.exports.fetchAll = async (req, res, next) => {
  const debug = await Exchange.query().eager('markets.[pair, exchange]').toString();
  console.log('Debug', debug);
  return res.status(200).json(await Exchange.query().eager('markets.[pair, exchange]'));
};