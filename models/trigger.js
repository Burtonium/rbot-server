const Order  = require('./order');

class Trigger extends Order {
  static get referenceHysteresis() {
    return 0.25;
  }
}

module.exports = Trigger;
