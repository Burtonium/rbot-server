const OrderCaddy = require('../models/order_caddy');

(async () => {
  const activeCaddies = await OrderCaddy.query()
  .where({ active: true })
  .eager('[triggers.market, triggerMarkets, referenceMarkets.exchange]')
  .modifyEager('triggers', query => {
    query.where('status', '=', 'open');
  });

  activeCaddies.map(c => c.updateTriggerOrders());

})().catch(e => console.log(e));