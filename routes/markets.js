const Market = require('../models/market');
const Exchange = require('../models/exchange');
const Settings = require('../models/exchange_settings');
const { knex } = require('../database/index');

module.exports.fetchAll = async (req, res) => {
  
  const markets = await Market.query().eager('[pair, exchange.settings]')
    .whereExists(
      Settings.query().whereRaw('exchange_settings.exchange_id = markets.exchange_id')
      .andWhere('exchange_settings.user_id', '=', req.user.id)
      .andWhere('exchange_settings.enabled', '=', true)
  );
  
  return res.status(200).json(markets);
}