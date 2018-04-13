const { Model } = require('../database');
const _ = require('lodash');

class OrderCaddy extends Model {
  // Amount of deviation allowed before orders renewal
  static get referenceHysteresis() {
    return 0.25;
  }

  static get tableName() {
    return 'order_caddies';
  }

  static get timestamp() {
    return true;
  }

  async updateTriggerOrders() {
    const { exchangeSettings } = await this.$relatedQuery('user').eager('exchangeSettings');

    const openOrders = await this.fetchOpenOrders();

    // update all open orders information
    await Promise.all(openOrders.map(t => {
      const exchange = t.market.exchange;
      const settings = exchangeSettings.find(s => s.exchangeId === exchange.id);
      return t.updateInfo(settings);
    }));

    const rt = await this.fetchReferenceTickers();
    const filledTriggers = (await this.$relatedQuery('triggers').eager('trades')).filter(trig => trig.filled > 0 && trig.status !== 'canceled' && trig.status !== 'error');

    try {
      await this.completeArbitrageForFilledTriggers(filledTriggers, exchangeSettings, rt);
    } catch (error) {
      console.error('Arb completion error:', error);
      await this.cancelAllOpenOrders();
      return OrderCaddy.query().patch({ active: false }).where({ id: this.id });
    }

    // renew triggers or create them if they're not there
    return Promise.all(this.triggerMarkets.map( async (tm) => {
      const settings =  exchangeSettings.find(s => s.exchangeId === tm.exchange.id);
      tm.exchange.userSettings = settings;

      const trigger = openOrders.find(t => t.marketId === tm.id && t.side === tm.side);
      let targetPrice = tm.side === 'buy' ? rt.targetBuyPrice : rt.targetSellPrice;
      let calculated = await tm.calculateTargetPrice(targetPrice, settings);

      if (trigger) {
        console.log(parseFloat(trigger.limitPrice));
        if (parseFloat(trigger.limitPrice) !== calculated) {
          const { id } = await trigger.renew(calculated, settings);
          await this.$relatedQuery('triggers').relate(id);
        }
      } else {
        await this.createTrigger(tm, {
          symbol: tm.symbol,
          side: tm.side,
          type: 'limit',
          amount: tm.amount,
          limitPrice: targetPrice
        });
      }
    }));
  }

  async fetchReferenceTickers() {
    const tickers = await Promise.all(this.referenceMarkets.map(rm => rm.fetchTicker()));

    // fetch lowest reference ask price
    const minAsk = tickers.reduce((min, t) => t.ask < min.ask ? t : min, tickers[0]);
    // fetch highest reference bid price
    const maxBid = tickers.reduce((max, t) => t.bid > max.bid ? t : max, tickers[0]);

    let targetBuyPrice = minAsk.ask * (1 - (this.minProfitabilityPercent / 100));
    let targetSellPrice = maxBid.bid * (1 + (this.minProfitabilityPercent / 100));

    if (minAsk.market.pair.quoteCurrency.type === 'fiat') { // TODO replace by currency.format()
      targetBuyPrice = targetBuyPrice.toFixed(2);
    }
    if (maxBid.market.pair.quoteCurrency.type === 'fiat') { // TODO replace by currency.format()
      targetSellPrice = targetSellPrice.toFixed(2);
    }

    return { minAsk, maxBid, targetBuyPrice, targetSellPrice };
  }

  async fetchOpenOrders() {
    return _.flatten(await this.$relatedQuery('triggers')
      .eager('[market.exchange.settings,arbCycle.orders.market.exchange.settings]')
      .modifyEager('market.exchange.settings', query => query.where('userId', this.userId))
      .modifyEager('arbCycle.orders.market.exchange.settings', query => query.where('userId', this.userId))
      .map(o => o.arbCycle ? o.arbCycle.orders : [o])).filter(o => o.status === 'open');
  }

  async createTrigger(market, order) {
    let created = {};
    const exchange = market.exchange;
    try {
      created = await exchange.createOrder(order);
    } catch (error) {
      try {
        console.error('Error creating triggers', error);
        await this.cancelAllOpenOrders();
      } catch (error) {
        console.error('Error canceling open orders');
      }
      return OrderCaddy.query().patch({ active: false }).where({ id: this.id });
    }
    return this.$relatedQuery('triggers').insert({
      userId: this.userId,
      marketId: market.id,
      status: 'open',
      ..._.pick(created, [ 'orderId', 'type', 'side', 'amount', 'limitPrice'])
    });
  }

  async completeArbitrageForFilledTriggers(triggers, settings, tickers) {
    for (let i = 0; i < triggers.length; i++) {
      const t = triggers[i];

      let arbCycle = await t.$relatedQuery('arbCycle').eager('orders');
      if (!arbCycle) {
        arbCycle = await t.$relatedQuery('arbCycle').insert({ userId: this.userId });
      }
      await arbCycle.placeReferenceOrder(tickers, settings);
    }
  }

  async cancelAllOpenOrders() {
    const triggers = this.triggers && this.triggers.filter(t => t.status === 'open');
    return Promise.all((triggers || await this.$relatedQuery('triggers').where('status', 'open')).map(t => t.cancel()));
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
        modelClass: `${__dirname}/trigger_market`,
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
        modelClass: `${__dirname}/trigger`,
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
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'order_caddies.userId',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = OrderCaddy;
