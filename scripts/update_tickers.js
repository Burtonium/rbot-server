require('dotenv').config();
const { knex } = require('../database/index');
const Exchange = require('../models/exchange');
const Ticker = require('../models/ticker');
const ApiCall = require('../models/api_call');
const _ = require('lodash');
const { wait } = require('../utils');

var exclusiveFilter = [];

/*
const exclusiveFilter = [
  'independentreserve',
  'bitstamp',
  'bitfinex',
  'idex'
];
*/

const filtered = [
  'allcoin',
  'bit2c',
  'bitmex',
  'bl3p',
  'braziliex',
  'btcexchange',
  'btcx',
  'coingi',
  'coinspot',
  'gatecoin',
  'huobi',
  'huobipro',
  'livecoin'
];

const individualTickersOnly = [
  'liqui',
  'coinegg',
  'yobit'
];

const fetchTickers = async (exchange, tickerCallback) => {
  let tickers;
  
  console.log("fetching tickers for " + exchange.name);
  const startTime = Date.now();

  if (exchange.has.fetchTickers && !individualTickersOnly.includes(exchange.ccxtId)) {
    tickers = await exchange.ccxt.fetchTickers();
    await Promise.all(Object.values(tickers).map(t => tickerCallback(t.symbol, t)));
  } else {
    const markets = exchange.markets;
    tickers = {};

    const promises = markets.map(async (market) => {
      tickers[market.symbol] = await exchange.ccxt.fetchTicker(market.symbol); // eslint-disable-line
      return tickerCallback && tickerCallback(market.symbol, tickers[market.symbol]);
    });

    await Promise.all(promises);
  }
  
  const apiCall = { 
    latency: Date.now() - startTime,
    method: 'fetchTickers',
    exchangeId: exchange.id
  };
  
  if (!(await ApiCall.query().insert(apiCall))) {
    console.error("Error: Couldn't insert api call to database");
  }
  
  return tickers;
};

const insertTickers = async () => {
  const exchanges = await Exchange.query().eager('markets');
  const promises = exchanges
    .filter(e => !exclusiveFilter.length || exclusiveFilter.includes(e.ccxtId))
    .filter(e => !filtered.includes(e.ccxtId))
    .map(async e => {
      await e.ccxt.loadMarkets();
      
      const result = fetchTickers(e, async (symbol, ticker) => {
        const market = e.markets.find(m => m.symbol === symbol);
        if (!market) {
          return false;
        }

        const insert = _.pick(ticker, ['ask', 'askVolume', 'bid', 'bidVolume', 'timestamp']);

        insert.timestamp = insert.timestamp ? new Date(insert.timestamp) : new Date();

        insert.marketId = market.id;
        return Ticker.query().insert(insert);
      }).catch(e => console.error('Error updating ticker:', e.message));
      
      return result;
    });
  return Promise.all(promises).then(() => console.log('Finished inserting tickers...'));
};

(async () => {
  while(true) {
    const results = await knex('exchanges').select('ccxt_id').whereIn('id', function() {
      this.select('exchange_id').from('exchange_settings').where('enabled', true);
    });
    exclusiveFilter = results.map(a => a.ccxtId);
    
    await insertTickers().catch(e => console.error(e.message));
    await wait(process.env.TICKER_UPDATE_DELAY || 1500);
  }
})().then(() => {
  process.exit(0);
});