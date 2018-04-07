require('dotenv').config();
const Exchange = require('../models/exchange');
const Ticker = require('../models/ticker');
const _ = require('lodash');

const exclusiveFilter = [
  'independentreserve',
  'bitstamp',
  'bitfinex'
];

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

  if (exchange.has.fetchTickers && !individualTickersOnly.includes(exchange.ccxtId)) {
    tickers = await exchange.ccxt.fetchTickers();
    Object.values(tickers).forEach(t => tickerCallback(t.symbol, t));
  } else {
    const markets = exchange.markets;
    tickers = {};

    const promises = markets.map(async (market) => {
      tickers[market.symbol] = await exchange.ccxt.fetchTicker(market.symbol); // eslint-disable-line
      return tickerCallback && tickerCallback(market.symbol, tickers[market.symbol]);
    });

    await Promise.all(promises);
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

      await fetchTickers(e, async(symbol, ticker) => {
        const market = e.markets.find(m => m.symbol === symbol);
        if (!market) {
          return false;
        }

        const insert = _.pick(ticker, ['ask', 'askVolume', 'bid', 'bidVolume', 'timestamp']);

        insert.timestamp = new Date(insert.timestamp);

        insert.marketId = market.id;
        return Ticker.query().insert(insert);
      }).catch((e) => {console.log(e)});
    });
  return Promise.all(promises).then(() => console.log('Finished inserting tickers...'));
};

(async () => {
  while(true) {
    await insertTickers();
  }
})().then(() => {
  process.exit(0);
});