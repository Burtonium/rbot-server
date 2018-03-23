const ccxt = require('ccxt');
const { knex } = require('../database');
const Market = require('../models/market');
const Exchange = require('../models/exchange');
const CurrencyPair = require('../models/currency_pair');

const _ = require('lodash');

(async () =>{
  for (let i = 0; i < ccxt.exchanges.length; i++) {
    const e = ccxt.exchanges[i];
    console.log(`Loading ${e} markets (${i + 1} of ${ccxt.exchanges.length})`);
    const exchange = new ccxt[e]();
    try {
      await exchange.loadMarkets(true);

      let exchangeId;
      try {
        const record = await Exchange.query().insert({ ccxt_id: e, name: exchange.name }).returning('*');
      } catch (error) {
        // Do nothing
      }

      const record = await Exchange.query().select('id').where({ ccxt_id: e}).first();
      exchangeId = record.id;

      if (exchangeId) {
        await Promise.all(Object.values(exchange.markets).map(async (market) => {
          let currencyPairId;
          try {
            let inserts = await CurrencyPair.query().insert({ quote: market.quote, base: market.base }).returning('*');
            currencyPairId = inserts[0].id;
          } catch (error) {
            const pair = await CurrencyPair.query().where({ quote: market.quote, base: market.base }).first();

            if (!pair) {
              throw new Error(`Warning: Unsupported pair ${market.base}/${market.quote}`);
            }
            currencyPairId = pair.id;
          }
          return Market.query().insert({ symbol: market.symbol, currencyPairId, exchangeId });
        })).catch(error => console.log(error.message));
      }
    } catch (e) {
      // console.log(e);
    }
  }
  process.exit();
})();