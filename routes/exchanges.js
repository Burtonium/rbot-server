const Exchange = require('../models/exchange');
const ExchangeSettings = require('../models/exchange_settings');
const assert = require('assert');
const { knex } = require('../database/index');
const _ = require('lodash');
const { raw } = require('objection');
const ccxt = require('ccxt');

const flattenSettings = e => {
  const exchange = _.omit(e, ['settings']);
  Object.assign(exchange, e.settings[0] && _.omit(e.settings[0].toJSON(), ['id', 'exchangeId']));
  return exchange;
};

module.exports.patch = async (req, res) => {
  const payload = req.body.exchange;
  const exchangeId = req.params.id;
  const exchange = await Exchange.query()
    .where('id', exchangeId)
    .eager('settings')
    .modifyEager('settings', query => query.where('userId', req.user.id))
    .first();

  if (!exchange) {
    return res.status(404).send('Exchange not found');
  }

  const upsert = _.pick(payload, ['secret', 'key', 'uid', 'password', 'enabled']);

  if (exchange.settings.length > 0) {
    const settings = exchange.settings[0];
    await ExchangeSettings.query().update(upsert).where('id', settings.id);
  } else {
    upsert.exchangeId = exchange.id;
    await req.user.$relatedQuery('exchangeSettings').insert(upsert);
  }

  const result = await Exchange.query()
    .where('id', exchange.id)
    .eager('settings')
    .modifyEager('settings', query => query.where('userId', req.user.id))
    .first();

  res.status(200).json({ success: true, exchange: flattenSettings(result) });
};

module.exports.fetchAll = async (req, res, next) => {
  const exchanges = await Exchange.query().eager('settings')
    .modifyEager('settings', query => query.where('userId', req.user.id));
    
  const latencies = await knex.raw(`
    select exchange_id, avg(latency) as ave_latency
    from (
      select exchange_id, latency
      from (
        select *, row_number() over (partition by exchange_id order by timestamp desc) as r
        from api_calls
      ) partitioned
      where r <= 10 and timestamp > NOW() - INTERVAL '1 minute'
    ) top_ten
    group by exchange_id
  `);
  
  exchanges.forEach((e) => {
    const l = latencies.rows.find(l => l.exchange_id == e.id);
    if (l) {
      e.latency = parseInt(l.ave_latency);
      e.status = 'active';
    } else {
      e.status = 'disabled';
    }
    
    e.requires = new ccxt[e.ccxtId]().requiredCredentials;
  });
  
  const response = exchanges.map(flattenSettings);
  return res.status(200).json(response);
};

module.exports.fetchBalances = async (req, res, next) => {
  const exchange = await Exchange.query()
    .where('id', req.params.id)
    .eager('settings')
    .modifyEager('settings', query => query.where('userId', req.user.id))
    .first();
  
  const ccxtObj = new ccxt[exchange.ccxtId]({
    ..._.omit(exchange.settings, ['key']),
    apiKey: exchange.settings.key,
  });
  
  const result = { success: false };
  try {
    result.data = await ccxtObj.fetchBalance();
    result.success = true;
  } catch(e) {
    console.error("Error: ", e.message);
  }
  
  return res.status(200).json(result);
}