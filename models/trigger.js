const Order  = require('./order');

class Trigger extends Order {
  // static get tableName() {
  //   return 'orders';
  // }

  // static get timestamp() {
  //   return true;
  // }
  static get referenceHysteresis() {
    return 0.25;
  }
}

module.exports = Trigger;
