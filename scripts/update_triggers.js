require('dotenv').config();
const OrderCaddy = require('../models/order_caddy');

(async () => {
  const activeCaddies = await OrderCaddy.query()
  .where({ active: true })
  .eager('[triggerMarkets.exchange, referenceMarkets.exchange]');

  await Promise.all(activeCaddies.map(c => c.updateTriggerOrders()));
})().catch(e => {
  console.log(e);
  process.exit(1);
});