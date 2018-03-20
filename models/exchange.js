const { Model } = require('../database');

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
}

module.exports = Exchange;
