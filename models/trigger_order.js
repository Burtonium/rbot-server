const { Model } = require('../database');

class TriggerOrder extends Model {
  static get tableName() {
    return 'order_caddies_triggers';
  }

  static relationMappings() {
    return {
      order: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/order`,
        join: {
          from: 'order_caddies_triggers.orderId',
          to: 'orders.id'
        }
      }
    };
  }
}

module.exports = TriggerOrder;