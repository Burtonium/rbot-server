const { Model } = require('../database');

class Order extends Model {
  static get tableName() {
    return 'orders';
  }

  static get timestamp() {
    return true;
  }

  static get virtualAttributes() {
    return ['filled'];
  }

  get filled() {
    return (this.trades || []).map(t => t.filled).reduce((a, b) => a + b, 0);
  }

  async updateInfo() {
    const market = await this.$relatedQuery('market').eager('exchange').first();
    const trades = await market.exchange.ccxt.fetchOrder(this.orderId, market.symbol);
    console.log(trades);
    return;
    await this.$relatedQuery('trades').delete();
    return Promise.all(trades.map(t => this.$relatedQuery('trades').insert({
      orderId: t.id,
      filled: t.filled,
      price: t.price
    })));
  }

  static get relationMappings() {
    return {
      market: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/market`,
        join: {
          from: 'orders.marketId',
          to: 'markets.id'
        }
      },
      trades: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/trade`,
        join: {
          from: 'orders.id',
          to: 'trades.orderId'
        }
      }
    };
  }

  update() {
    this.market.exchange;
  }
}

module.exports = Order;
