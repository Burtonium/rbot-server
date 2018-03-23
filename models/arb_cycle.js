const { Model } = require('../database');

class ArbCycle extends Model {
  static get tableName() {
    return 'arb_cycles';
  }

  static get timestamp() {
    return true;
  }

  static get relationMappings() {
    return {
      orders: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/order`,
        join: {
          from: 'arb_cycles.id',
          through: {
            from: 'arb_cycle_orders.arbCycleIds',
            to: 'arb_cycle_orders.orderId'
          },
          to: 'orders.id'
        }
      }
    };
  }
}

module.exports = ArbCycle;
