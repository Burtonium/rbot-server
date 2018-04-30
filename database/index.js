const config = require('../knexfile.js');
const knex = require('knex')(config);
const objection = require('objection');
const objectionTimestamp = require('objection-timestamp');
const visibilityPlugin = require('objection-visibility');
const _ = require('lodash');

objectionTimestamp.register(objection, {
  create: 'created_at',
  update: 'updated_at'
});

objection.Model.knex(knex);

module.exports = {
  knex,
  Model: visibilityPlugin(objection.Model)
};
