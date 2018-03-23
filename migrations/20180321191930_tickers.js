exports.up = knex => knex.schema.createTable('tickers', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('market_id').unsigned().references('id').inTable('markets').index();
    table.decimal('bid', 30, 15);
    table.decimal('bidVolume', 30, 15);
    table.decimal('ask', 30, 15);
    table.decimal('askVolume', 30, 15);
    table.dateTime('timestamp').notNullable().index();
  });

exports.down = knex => knex.schema.dropTableIfExists('tickers');

