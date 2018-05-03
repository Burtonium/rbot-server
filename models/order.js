const { Model } = require('../database');
const _ = require('lodash');

class Order extends Model {
  static get tableName() {
    return 'orders';
  }

  static get timestamp() {
    return true;
  }

  static get virtualAttributes() {
    return ['filled', 'averagePrice', 'cost'];
  }

  get filled() {
    return (this.trades || []).map(t => t.filled).reduce((a, b) => a + b, 0);
  }

  get cost() {
    return (this.trades || []).map(t => t.cost).reduce((a, b) => a + b, 0);
  }

  get averagePrice() {
    const trueCost = (this.trades || []).reduce((acc, cur) => {
      return acc + (cur.filled * cur.price);
    }, 0);
    return trueCost / this.filled;
  }

  async updateInfo() {
    const market = await this.$relatedQuery('market').eager('exchange').first();
    const { exchangeSettings } = await this.$relatedQuery('user').eager('exchangeSettings');
    const settings = exchangeSettings.find(s => s.exchangeId === market.exchangeId);
    market.exchange.userSettings = settings;

    let info = null;
    try {
      if (market.exchange.has.fetchOrder) {
        info = await market.exchange.ccxt.fetchOrder(this.orderId);
      } else if (market.exchange.has.fetchOpenOrders) {
        let orders = await market.exchange.fetchOpenOrders(market.symbol);
        info = orders.find(o => o.orderId === this.OrderId);
      }
      if (info && info.status) {
        await Order.query().patch({ status: info.status }).where({ id: this.id });
      }
    } catch (error) {
      console.error(`Update error for order ${this.orderId}:`, error.message);
      if (error.message.indexOf('doesn\'t exist')) {
        return Order.query().patch({ status: 'canceled' }).where({ id: this.id });
      }
      try {
        await this.cancel();
      } catch (error) {
        console.error('Cancelation error', error.message);
        return;
      }
    }

    const trades = await market.exchange.ccxt.fetchMyTrades(market.symbol);
    const filtered = trades.filter(t => t.order === this.orderId).map(t => ({
        filled: t.amount,
        price: t.price,
        timestamp: t.datetime
      })
    );

    // TODO: check for new trades here
    await this.$relatedQuery('trades').delete();
    await this.$relatedQuery('trades').insert(filtered);

    if (this.filled >= parseFloat(this.amount)) {
      this.status = 'closed';
      await Order.query().patch({ status: 'closed' }).where({ id: this.id });
    }
  }

  async cancel() {
    const { exchangeSettings } = await this.$relatedQuery('user').eager('exchangeSettings');
    const exchange = await (this.exchange || await this.$relatedQuery('exchange'));
    exchange.userSettings = exchangeSettings.find(s => s.exchangeId === exchange.id);
    await exchange.ccxt.cancelOrder(this.orderId);
    return Order.query().patch({ status: 'canceled' }).where({ id: this.id });
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
      exchange: {
        relation: Model.HasOneThroughRelation,
        modelClass: `${__dirname}/exchange`,
        join: {
          from: 'orders.marketId',
          through: {
            from: 'markets.id',
            to: 'markets.exchangeId'
          },
          to: 'exchanges.id'
        }
      },
      trades: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/trade`,
        join: {
          from: 'orders.id',
          to: 'trades.orderId'
        }
      },
      arbCycle: {
        relation: Model.HasOneThroughRelation,
        modelClass: `${__dirname}/arb_cycle`,
        join: {
          from: 'orders.id',
          through: {
            from: 'arb_cycle_orders.orderId',
            to: 'arb_cycle_orders.arbCycleId'
          },
          to: 'arb_cycles.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'orders.userId',
          to: 'users.id'
        }
      }
    };
  }

  async renew(targetPrice, amount, settings) {
    const exchange = await this.$relatedQuery('exchange');
    exchange.userSettings = settings;
    await this.cancel();

    const order = await exchange.createOrder({
      ..._.pick(this, ['side', 'type']),
      amount,
      symbol: this.market.symbol,
      limitPrice: targetPrice
    });

    return Order.query().insert({
      userId: this.userId,
      marketId: this.marketId,
      status: 'open',
      amount,
      ..._.pick(order, [ 'orderId', 'type', 'side', 'limitPrice'])
    });
  }
}

module.exports = Order;
