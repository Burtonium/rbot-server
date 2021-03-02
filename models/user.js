const { Model } = require('../database');
const Password = require('objection-password')({ allowEmptyPassword: true });
const _ = require('lodash');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

  async notify(type, message) {
    try {
      if (this.email) {
        const msg = {
          to: this.email,
          from: process.env.NOTIFICATIONS_EMAIL,
          subject: 'Rbot Notification',
          text: message
        };
        sgMail.send(msg);
      }
      await this.$relatedQuery('notifications').insert({ message, type });
    } catch (error) {
      console.error('Error notifying user:', error.message);
    }
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
      },
      notifications: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/notifications`,
        join: {
          from: 'users.id',
          to: 'notifications.user_id'
        }
      }
    };
  }
}

module.exports = User;
