const { Model } = require('../database');
const ccxt = require('ccxt');
const _ = require('lodash');
const proxies = (process.env.PROXIES || '').split(',').filter(p => !!p).map(p => `http://${p}:8080/`);
const store = require('node-persist');
const assert = require('assert');
const { precisionRound } = require('../utils');

store.init();

class Exchange extends Model {
  static get tableName() {
    return 'exchanges';
  }

  static get timestamp() {
    return false;
  }

  static get relationMappings() {
    return {
      markets: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/market`,
        join: {
          from: 'exchanges.id',
          to: 'markets.exchangeId'
        }
      }
    };
  }

  get ccxt() {
    this.lazyLoadCcxt();
    this.cycleProxy();
    return this.instance;
  }

  set ccxt(instance) {
    this.instance = instance;
  }

  lazyLoadCcxt() {
    if (!this.instance) {
      this.instance =  new ccxt[this.ccxtId]();
    }
  }

  get has() {
    this.lazyLoadCcxt();
    return this.instance.has;
  }

  cycleProxy() {
    if (proxies.length) {
      const index = store.getItemSync(this.ccxtId) || 0;
      this.instance.proxy = proxies[index % proxies.length];
      store.setItemSync(this.ccxtId, index + 1);
    }
  }

  $formatJson(json) {
    return _.omit(json, ['ccxt', 'instance']);
  }

  async createOrder(order) {
    assert(order.symbol
      && ['buy', 'sell'].includes(order.side)
      && ['limit', 'market'].includes(order.type)
      && order.amount
      && order.limitPrice, 'Order invalid');

    const response = await this.ccxt.createOrder(order.symbol, order.type, order.side,
      order.amount, precisionRound(order.limitPrice, 6));

    order.timestamp = new Date();
    order.orderId = response.id;
    return order;
  }
}

module.exports = Exchange;
