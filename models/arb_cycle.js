const { Model } = require('../database');

class ArbCycle extends Model {
  static get tableName() {
    return 'arb_cycles';
  }

  static get timestamp() {
    return true;
  }
}

module.exports = ArbCycle;
