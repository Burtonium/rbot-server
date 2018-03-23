exports.up = knex => knex.schema.createTable('exchange_settings', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('exchange_id').unsigned().references('id').inTable('exchanges');
    table.bigInteger('user_id').unsigned().references('id').inTable('users');
    table.boolean('enabled');
    table.string('secret');
    table.string('key');
    table.unique(['exchange_id', 'user_id']);
  });

exports.down = knex => knex.schema.dropTableIfExists('exchange_settings');

