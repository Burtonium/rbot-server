exports.up = knex => knex.schema.createTable('order_caddies_reference_markets', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('order_caddies_id').references('id').inTable('order_caddies').index().onDelete('CASCADE');
    table.bigInteger('market_id').references('id').inTable('markets').index();
  });

exports.down = knex =>  knex.schema.dropTableIfExists('order_caddies_reference_markets');
