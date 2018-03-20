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
}

module.exports = User;
