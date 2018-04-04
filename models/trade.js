const { Model } = require('../database');

class Trade extends Model {
  static get tableName() {
    return 'trades';
  }

  static get timestamp() {
    return false;
  }
}

module.exports = Trade;
