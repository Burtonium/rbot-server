const assert = require('assert');
const { Model } = require('../database');
const Order = require('./order');
const _ = require('lodash');

const percentDifference = (val1, val2) => {
  return Math.abs(val1 - val2) / ((val1 + val2) / 2);
}

class OrderCaddy extends Model {
  // Amount of deviation allowed before updating orders
  static get referenceHysteresis() {
    return 0.5;
  }

  static get tableName() {
    return 'order_caddies';
  }

  static get timestamp() {
    return true;
  }

  async updateTriggerOrders() {
    const openTriggers = await this.fetchOpenTriggers();
    const promises = this.triggerMarkets.map(async (tm) => {
      const rt = await this.fetchReferenceTickers();
      // fetch lowest reference ask price
      const minAsk = rt.reduce((min, t) => t.ask < min.ask ? t : min, rt[0]);
      // fetch highest reference bid price
      const maxBid = rt.reduce((max, t) => t.bid > max.bid ? t : max, rt[0]);
      const targetBuyPrice = minAsk.ask *= 1 - (this.minProfitabilityPercent / 100);
      const targetSellPrice = maxBid.bid *= 1 + (this.minProfitabilityPercent / 100);
      const trigger = openTriggers.find(t => t.market.symbol === tm.symbol);

      if (trigger) {
        if (trigger.side === 'buy'
          && percentDifference(trigger.price, targetBuyPrice) > OrderCaddy.referenceHysteresis) {
          // renew trigger
        } else if (trigger.side === 'sell'
          && percentDifference(trigger.price, targetSellPrice) > OrderCaddy.referenceHysteresis) {
          // renew trigger
        }
      } else {
        await this.createTrigger(tm, {
          symbol: tm.symbol,
          side: tm.side,
          type: 'limit',
          amount: tm.amount,
          limitPrice: tm.side === 'buy' ? targetBuyPrice : targetSellPrice
        });
      }
    });
    return Promise.all(promises);
  }

  fetchReferenceTickers() {
    return Promise.all(this.referenceMarkets.map(rm => rm.fetchTicker()));
  }

  fetchOpenTriggers() {
    return this.$relatedQuery('triggers').eager('market').where('status', '=', 'open');
  }

  async createTrigger(market, order) {
    const exchange = market.exchange || await market.$relatedQuery('exchange');
    const created = await exchange.createOrder(order);
    return this.$relatedQuery('triggers').insert({
      userId: this.userId,
      marketId: market.id,
      status: 'open',
      ..._.pick(created, [ 'orderId', 'type', 'side', 'amount', 'limitPrice'])
    });
  }

  static get relationMappings() {
    return {
      referenceMarkets: {
        relation: Model.ManyToManyRelation,
        modelClass: `${__dirname}/market`,
        join: {
          from: 'order_caddies.id',
          through: {
            from: 'order_caddies_reference_markets.orderCaddiesId',
            to: 'order_caddies_reference_markets.marketId'
          },
          to: 'markets.id'
        }
      },
      triggerMarkets: {
        relation: Model.ManyToManyRelation,
        modelClass: `${__dirname}/market`,
        join: {
          from: 'order_caddies.id',
          through: {
            extra: ['side', 'amount'],
            from: 'order_caddies_trigger_markets.orderCaddiesId',
            to: 'order_caddies_trigger_markets.marketId'
          },
          to: 'markets.id'
        }
      },
      triggers: {
        relation: Model.ManyToManyRelation,
        modelClass: `${__dirname}/order`,
        join: {
          from: 'order_caddies.id',
          through: {
              from: 'order_caddies_triggers.orderCaddiesId',
              to: 'order_caddies_triggers.orderId'
          },
          to: 'orders.id'
        }
      },
      pair: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/currency_pair`,
        join: {
          from: 'order_caddies.currencyPairId',
          to: 'currency_pairs.id'
        }
      }
    };
  }
}

module.exports = OrderCaddy;
