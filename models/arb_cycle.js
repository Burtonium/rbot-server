const { Model } = require('../database');
const _ = require('lodash');
const assert = require('assert');

class ArbCycle extends Model {
  static get tableName() {
    return 'arb_cycles';
  }

  static get timestamp() {
    return true;
  }

  static get namedFilters() {
    return {
      sells: query => query.where('side', 'sell'),
      buys: query => query.where('side', 'buys')
    };
  }

  static get relationMappings() {
    return {
      orders: {
        relation: Model.ManyToManyRelation,
        modelClass: `${__dirname}/order`,
        join: {
          from: 'arb_cycles.id',
          through: {
            from: 'arb_cycle_orders.arbCycleId',
            to: 'arb_cycle_orders.orderId'
          },
          to: 'orders.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'arb_cycles.userId',
          to: 'users.id'
        }
      }
    };
  }

  async difference() {
    const { buy, sell } = _.groupBy(this.orders || await this.$relatedQuery('orders'), 'side');
    const totalOnBuys = (buy || []).reduce((amount, o) => amount + parseFloat(o.amount), 0);
    const totalOnSells = (sell || []).reduce((amount, o) => amount + parseFloat(o.amount), 0);
    return totalOnBuys - totalOnSells;
  }

  async placeReferenceOrder({ minAsk, maxBid }) {
    assert(minAsk && maxBid, 'minAsk and maxBid are required');
    const difference = await this.difference();

    const side = difference > 0 ? 'sell' : 'buy';
    const ticker = side === 'sell' ? maxBid : minAsk;

    if (difference === 0) {
      return;
    }

    console.log('Completing an arb for: ', Math.abs(difference));

    const exchange = ticker.market.exchange;
    const { exchangeSettings } = await this.$relatedQuery('user')
      .eager('exchangeSettings')
      .modifyEager('exchangeSettings', query => query.where('exchangeId', exchange.id));
    exchange.userSettings = exchangeSettings && exchangeSettings[0];

    const created = await exchange.createOrder({
      symbol: ticker.market.symbol,
      type: 'market',
      amount: Math.abs(difference),
      side
    });

    return this.$relatedQuery('orders').insert({
      userId: this.userId,
      marketId: ticker.market.id,
      status: 'open',
      ..._.pick(created, [ 'orderId', 'type', 'side', 'amount'])
    });
  }
}

module.exports = ArbCycle;
