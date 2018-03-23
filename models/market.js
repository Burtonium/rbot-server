const { Model } = require('../database');

class Market extends Model {
  static get tableName() {
    return 'markets';
  }

  static get timestamp() {
    return false;
  }

  static get relationMappings() {
    return {
      pair: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/currency_pair`,
        join: {
          from: 'markets.currencyPairId',
          to: 'currency_pairs.id'
        }
      },
      exchange: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/exchange`,
        join: {
          from: 'markets.exchangeId',
          to: 'exchanges.id'
        },
      }
    };
  }

  fetchTicker() {
    return this.query().select('tickers.*')
      .join('markets', 'markets.id', 'tickers.marketId')
      .orderBy('created_at', 'desc')
      .first();
  }

  fetchOrderBook() {
    return this.exchange.fetchOrderBook(this.symbol, 10, );
  }
}

module.exports = Market;
