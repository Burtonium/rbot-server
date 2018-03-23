const OrderCaddy = require('../models/order_caddy');

module.exports.fetchAll = async (req, res) => {
  return res.status(200).json(await OrderCaddy.query()
    .eager('[triggers, pair, referenceMarkets.exchange, triggerMarkets.exchange]'));
};

module.exports.create = async (req, res) => {
  if (!req.user) {
    throw new Error('User required');
  }

  const caddy = req.body.caddy;
  await OrderCaddy.query().insertGraph({
    ...caddy,
    userId: req.user.id
  }, {
    relate: true
  });

  res.status(200).json({ success: true });
};