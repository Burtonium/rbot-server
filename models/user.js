const { Model } = require('../database');
const Password = require('objection-password')({ allowEmptyPassword: true });
const _ = require('lodash');

class User extends Password(Model) {
  static get tableName() {
    return 'users';
  }

  static get timestamp() {
    return true;
  }

  toJSON() {
    return _.pick(this, ['id', 'username']);
  }

  static get relationMappings() {
    return {
      arbCycles: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/arb_cycle`,
        join: {
          from: 'users.id',
          to: 'arb_cycles.userId'
        }
      },
      exchangeSettings: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/exchange_settings`,
        join: {
          from: 'users.id',
          to: 'exchange_settings.userId'
        }
      }
    };
  }
}

module.exports = User;
