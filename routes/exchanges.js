const Exchange = require('../models/exchange');
const ExchangeSettings = require('../models/exchange_settings');
const { knex } = require('../database/index');
const _ = require('lodash');

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

  const upsert = _.pick(payload, ['secret', 'apiKey', 'uid', 'password', 'enabled']);

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

  exchanges.forEach((e, index, arr) => {
    e.loadRequirements();

    const l = latencies.rows.find(l => l.exchange_id == e.id);
    if (l) {
      e.latency = parseInt(l.ave_latency);
      e.status = 'active';
    } else {
      e.status = 'disabled';
    }

    arr[index] = Object.assign(_.omit(e, ['settings']),
      _.omit(e.settings[0], ['id', 'exchangeId']));
  });

  return res.status(200).json(exchanges);
};

module.exports.fetchBalances = async (req, res, next) => {
  const exchange = await Exchange.query()
    .where('id', req.params.id)
    .eager('settings')
    .modifyEager('settings', query => query.where('userId', req.user.id))
    .first();

  exchange.userSettings = exchange.settings[0];

  const result = { success: false };
  try {
    result.balances = await exchange.ccxt.fetchBalance();
    result.success = true;
  } catch(e) {
    console.error("Error: ", e.message);
  }
  return res.status(200).json(result);
};
