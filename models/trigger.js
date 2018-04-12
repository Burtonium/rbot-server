const Order  = require('./order');
const { percentDifference } = require('../utils');

class Trigger extends Order {
  static get referenceHysteresis() {
    return 0.25;
  }

  needsRenewal(targetPrice) {
    return percentDifference(this.limitPrice, targetPrice) > Trigger.referenceHysteresis;
  }
}

module.exports = Trigger;
