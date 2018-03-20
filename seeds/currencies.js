const currencies = require('./data/currencies');

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('currencies').del()
    .then(function() {
      // Inserts seed entries
      return knex('currencies').insert(currencies);
    }
  );
};
