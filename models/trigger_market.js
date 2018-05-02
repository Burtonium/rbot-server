const Market = require('./market');
const { percentDifference } = require('../utils');

class TriggerMarket extends Market {
  // one penny above or below on an order beyond what our target price is
  async calculateTargetPrice(targetPrice, settings, currentOrder = {}) {
    const exchange = this.exchange || this.$relatedQuery('exchange');
    exchange.userSettings = settings;
    const books = await exchange.ccxt.fetchOrderBook(this.symbol);
    let adjustedPrice = targetPrice;
    if (this.side === 'buy') {
      adjustedPrice = books.bids.map(b => b[0]).find(p => p < targetPrice) || targetPrice;
      if (adjustedPrice !== parseFloat(currentOrder.limitPrice)) {
        adjustedPrice += 0.01;
      }
    } else {
      adjustedPrice = books.asks.map(a => a[0]).find(p => p > targetPrice) || targetPrice;
      if (adjustedPrice !== parseFloat(currentOrder.limitPrice)) {
        adjustedPrice += 0.01;
      }
    }

    return adjustedPrice;
  }
}

module.exports = TriggerMarket;
