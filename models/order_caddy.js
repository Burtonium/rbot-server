const assert = require('assert');
const { Model } = require('../database');

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
    const promises = this.triggerMarkets.map(async (tm) => {
      const trigger = this.triggers.find(t => t.market.symbol === tm.symbol);
      const referencePrice = await this.fetchReferencePrice();
      if (trigger) {

      } else {
        // create trigger
      }
    })
    return Promise.all(promises);
  }

  async fetchReferencePrice() {
    const tickers = await Promise.all(this.referenceMarkets.map(rm => rm.fetchTicker()));
    console.log('Tickers', tickers);
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
            extra: ['side'],
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
