exports.up = knex => knex.schema.createTable('order_caddies_triggers', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('order_caddies_trigger_markets_id').references('id').inTable('order_caddies_trigger_markets').index();
    table.bigInteger('order_id').references('id').inTable('orders').index();
  });

exports.down = knex =>  knex.schema.dropTableIfExists('order_caddies_triggers');
