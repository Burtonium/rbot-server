const OrderCaddy = require('../models/order_caddy');
const TriggerMarket = require('../models/trigger_market');
const Market = require('../models/market');

module.exports.fetchAll = async (req, res) => {
  return res.status(200).json(await OrderCaddy.query());
};

module.exports.create = async (req, res) => {
  if (!req.user) {
    throw new Error('User required');
  }

  const caddy = req.body.caddy;
  const referenceIds = caddy.referenceMarkets.map(m => m.id);
  const referenceMarkets = await Market.query().whereIn('id', referenceIds);
  const triggerIds = caddy.triggerMarkets.map(m => m.id);
  const triggerMarkets = await Market.query().whereIn('id', triggerIds);

  const insert = await OrderCaddy.query().insertGraph({
    ...caddy,
    userId: req.user.id
  }, {
    relate: true
  });

  console.log(insert);
  res.status(200).json({ success: true });
};