const Market = require('./market');
const { percentDifference } = require('../utils');

class TriggerMarket extends Market {
  async calculateTargetPrice(targetPrice, settings) {
    const exchange = this.exchange || this.$relatedQuery('exchange');
    exchange.userSettings = settings;
    const books = await exchange.ccxt.fetchOrderBook(this.symbol);
    let adjustedPrice = targetPrice;
    // one penny above or below beyond what our target price is
    if (this.side === 'buy') {
      adjustedPrice = books.bids.map(b => b[0]).find(p => p < targetPrice) || targetPrice;
      adjustedPrice += 0.01;
    } else {
      adjustedPrice = books.asks.map(a => a[0]).find(p => p > targetPrice) || targetPrice;
      adjustedPrice -= 0.01;
    }

    return adjustedPrice;
  }
}

module.exports = TriggerMarket;
