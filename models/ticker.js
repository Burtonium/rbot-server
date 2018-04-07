const { Model } = require('../database');

class Ticker extends Model {
  static get tableName() {
    return 'tickers';
  }

  static get timestamp() {
    return false;
  }

  static get namedFilters() {
    return {
      latest: query => query.orderBy('timestamp', 'desc').limit(100)
    };
  }

  static get relationMappings() {
    return {
      market: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/market`,
        join: {
          from: 'tickers.marketId',
          to: 'markets.id'
        }
      }
    };

  }
}

module.exports = Ticker;
