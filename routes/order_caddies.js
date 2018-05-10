const OrderCaddy = require('../models/order_caddy');
const assert = require('assert');
const _ = require('lodash');

async function getCaddy(id, userId) {
  return await OrderCaddy.query()
    .where({ id, userId })
    .eager(`[
    triggers.[
      arbCycle.orders.[
        market.exchange,
        trades
      ],
      market.exchange,
      trades
    ],
    referenceMarkets.[
      tickers(latest),
      exchange,
    ],
    triggerMarkets.[
      exchange
    ],
    pair
    ]`).modifyEager('referenceMarkets', query => query.orderBy('id'))
    .modifyEager('triggerMarkets', query => query.orderBy('id')).first();
}

module.exports.fetchAll = async (req, res) => {
  assert(req.user);
  const caddies = await OrderCaddy.query()
    .eager('[triggers, pair, referenceMarkets.exchange, triggerMarkets.exchange]')
    .where('userId', req.user.id);

  return res.status(200).json(caddies);
};

module.exports.fetchOne = async (req, res) => {
  assert(req.user);
  const caddyId = req.params.id;
  const userId = req.user.id;
  const caddy = await getCaddy(caddyId, userId);
  return caddy ?  res.status(200).json(caddy) : res.status(404);
};

module.exports.create = async (req, res) => {
  assert(req.user);
  const caddy = req.body.caddy;
  await OrderCaddy.query().insertGraph({
    ...caddy,
    userId: req.user.id
  }, {
    relate: true
  });

  res.status(200).json({ success: true });
};

module.exports.deleteOne = async (req, res) => {
  assert(req.user);
  const caddyId = req.params.id;
  try {
    const caddy = await OrderCaddy.query().eager('triggers').where({ id: caddyId }).first();

    if (!caddy) {
      return res.status(200).json({ success: true });
    }

    await caddy.cancelAllOpenOrders();
    await caddy.$relatedQuery('triggers').unrelate();
    await OrderCaddy.query().delete().where({ id: caddyId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false });
  }
  return res.status(200).json({ success: true });
};

module.exports.patch = async (req, res) => {
  const payload = req.body.caddy;
  const caddyId = req.params.id;
  const userId = req.user.id;
  
  const caddy = await OrderCaddy.query()
    .where('id', caddyId).where('user_id', req.user.id)
    .first();

  if (!caddy) {
    return res.status(404).send('Caddy not found');
  }
  
  const upsert = _.omit(payload, ['pair', 'createdAt', 'updatedAt']);
  upsert.referenceMarkets.forEach((m, index, arr) =>
    arr[index] = _.omit(m, ['pair', 'exchange', 'tickers'])
  );
  
  const success = await OrderCaddy.query()
    .upsertGraph(upsert, { relate: true, unrelate: true });
    
  const result = await getCaddy(caddyId, userId);

  return res.status(200).json({ success: true, caddy: result });
};