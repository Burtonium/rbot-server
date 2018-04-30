const Exchange = require('../models/exchange');

module.exports.fetchOne = async (req, res, next) => {
  const exchange = await Exchange.query()
    .where( { exchangeId: req.params.exchangeId })
    .eager('markets.[pair, exchange], exchangeSettings')
    .modifyEager('exchangeSettings', query => {
      query.where('userId', '=', req.user.id);
    });
  return res.status(200).json(exchanges);
};

module.exports.fetchAll = async (req, res, next) => {
  const exchanges = await Exchange.query().eager('markets.[pair, exchange]');
  
  return res.status(200).json(exchanges);
};