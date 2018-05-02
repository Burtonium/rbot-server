const { Model } = require('../database');

class ApiCall extends Model {
  static get tableName() {
    return 'api_calls';
  }

  static get timestamp() {
    return false;
  }
  
  static get relationMappings() {
    return {
      market: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/exchange`,
        join: {
          from: 'api_calls.exchange_id',
          to: 'exchanges.id'
        }
      }
    };
  }
}

module.exports = ApiCall;

