const OrderCaddy = require('./order_caddy');

class CaddyManager {
  async updateOrders() {
    const activeCaddies = await OrderCaddy.query()
      .where({ active: true })
      .eager('[triggers.market, triggerMarkets, referenceMarkets]')
      .modifyEager('triggers', query => {
        query.where('status', '=', 'open');
      });

    activeCaddies.forEach(async (c) => {
      await c.f();
    });
  }

}

export default CaddyManager;