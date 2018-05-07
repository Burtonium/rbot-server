const CurrencyPair = require('../models/currency_pair');
const { knex } = require('../database/index');

module.exports.fetchAll = async (req, res, next) => {
  return res.status(200).json(await CurrencyPair.query());
};