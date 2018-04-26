const { Model } = require('../database');

class Notification extends Model {
  static get tableName() {
    return 'notifications';
  }

  static get timestamp() {
    return true;
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'notifications.userId',
          to: 'users.id'
        }
      }
    };

  }
}

module.exports = Notification;
