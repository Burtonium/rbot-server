require('dotenv').config();
const OrderCaddy = require('../models/order_caddy');

let loop = true;

process.on('SIGINT', function() {
  console.log('Safely exiting after loop...');
  loop = false;
});

let index = 0;

(async () => {
  while(loop) {
    const activeCaddies = await OrderCaddy.query()
    .where({ active: true })
    .eager('[triggerMarkets.[exchange,pair.[baseCurrency,quoteCurrency]], referenceMarkets.exchange]');

    await Promise.all(activeCaddies.map(c => c.updateTriggerOrders())).catch(e => console.error('Error updating triggers:', e.message));
    index++;
  }
})().then(() => {
  console.log(`Completed ${index} loops`);
  process.exit(0);
});