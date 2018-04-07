const OrderCaddy = require('../models/order_caddy');
const assert = require('assert');

module.exports.fetchAll = async (req, res) => {
  assert(req.user);
  const caddies = await OrderCaddy.query()
    .eager('[triggers, pair, referenceMarkets.exchange, triggerMarkets.exchange]')
    .where('userId', req.user.id);

  return res.status(200).json(caddies);
};

module.exports.fetchOne = async (req, res) => {
  assert(req.user);
  const id = req.params.id;
  const caddy = await OrderCaddy.query()
    .where({ id, userId: req.user.id })
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
      ]
    ]`).first();
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

    await caddy.cancelAllOrders();
    await caddy.$relatedQuery('triggers').unrelate();
    await OrderCaddy.query().delete().where({ id: caddyId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false });
  }
  return res.status(200).json({ success: true });
};