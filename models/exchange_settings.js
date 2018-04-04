const { Model } = require('../database');

class ExchangeSettings extends Model {
  static get tableName() {
    return 'exchange_settings';
  }

  static get timestamp() {
    return false;
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'exchange_settings.userId',
          to: 'users.id'
        }
      },
      exchange: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/exchange`,
        join: {
          from: 'exchange_settings.exchangeId',
          to: 'exchanges.id'
        }
      }
    };
  }
}

module.exports = ExchangeSettings;
