const { Model } = require('../database');

class Order extends Model {
  static get tableName() {
    return 'orders';
  }

  static get timestamp() {
    return true;
  }

  update() {

  }

  static get relationMappings() {
    return {
      exchange: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/models/exchange`,
        join: {
          from: 'orders.exchangeId',
          to: 'exchanges.id'
        }
      }
    };
  }
}

module.exports = Order;
