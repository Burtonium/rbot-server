const assert = require('assert');
const { Model } = require('../database');

class OrderCaddy extends Model {
  static get tableName() {
    return 'order_caddies';
  }

  static get timestamp() {
    return true;
  }

  update() {

  }

  fetchTriggerOrderStatuses() {
    this.triggerOrders.filter(o => o.status === 'open').forEach((o) => { o.update(); });
  }

  static get relationMappings() {
    return {
      referenceMarkets: {
        relation: Model.ManyToManyRelation,
        modelClass: `${__dirname}/market`,
        join: {
          from: 'order_caddies.id',
          through: {
            from: 'order_caddies_reference_markets.orderCaddiesId',
            to: 'order_caddies_reference_markets.marketId'
          },
          to: 'markets.id'
        }
      },
      triggerMarkets: {
        relation: Model.ManyToManyRelation,
        modelClass: `${__dirname}/market`,
        join: {
          from: 'order_caddies.id',
          through: {
            modelClass: `${__dirname}/trigger_market`,
            extra: ['side'],
            from: 'order_caddies_trigger_markets.orderCaddiesId',
            to: 'order_caddies_trigger_markets.marketId'
          },
          to: 'markets.id'
        }
      },
    };
  }
}

module.exports = OrderCaddy;
