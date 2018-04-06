const { Model } = require('../database');
const _ = require('lodash');

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
      },
      tickers: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/ticker`,
        join: {
          from: 'markets.id',
          to: 'tickers.marketId'
        }
      },
      orders: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/order`,
        join: {
          from: 'markets.id',
          to: 'orders.marketId'
        }
      }
    };
  }

  async fetchTicker() {
    const ticker = await this.$relatedQuery('tickers')
      .eager('market.[exchange,pair.quoteCurrency]')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .first();
    if (new Date() - ticker.timestamp > 5 * 60 * 1000) {
      throw new Error('Outdated tickers. Make sure you are updating your prices');
    }
    return ticker;
  }

  fetchOrderBook() {
    return this.exchange.fetchOrderBook(this.symbol, 10);
  }

  async createOrder(order, userId) {
    const created = await this.exchange.createOrder(order);
    return this.$relatedQuery('orders').insert({
      userId,
      status: 'open',
      ..._.pick(created, [ 'orderId', 'type', 'side', 'amount', 'limitPrice'])
    });
  }
}

module.exports = Market;
