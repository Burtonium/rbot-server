exports.up = knex => knex.schema.createTable('exchanges', (table) => {
    table.bigIncrements().primary();
    table.string('ccxt_id').unique();
    table.string('name').notNullable();
    table.string('key');
    table.string('secret');
  });

exports.down = knex => knex.schema.dropTableIfExists('exchanges');

