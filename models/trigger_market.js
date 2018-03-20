const { Model } = require('../database');

class TriggerMarket extends Model {
  static get tableName() {
    return 'order_caddies_trigger_markets';
  }

  static get timestamp() {
    return false;
  }

  static get relationMappings() {
    return {
      market: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/market`,
        join: {
          from: 'order_caddies_trigger_markets.marketId',
          to: 'markets.id'
        }
      },
      orders: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/order`,
        join: {
          from: 'order_caddies_trigger_markets.id',
          through: {
            from: 'order_caddies_triggers.orderCaddiesTriggerMarketsId',
            to: 'order_caddies_triggers.orderId'
          },
          to: 'orders.id'
        }
      }
    };
  }
}

module.exports = TriggerMarket;