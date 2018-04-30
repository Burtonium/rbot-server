exports.up = knex => knex.schema.table('exchange_settings', (table) => {
  table.renameColumn('key', 'api_key');
});

exports.down = knex =>  knex.schema.table('exchange_settings', (table) => {
  table.renameColumn('api_key', 'key');
});
