const CurrencyPair = require('../models/currency_pair');

module.exports.fetchAll = async (req, res, next) => {
  return res.status(200).json(await CurrencyPair.query());
};